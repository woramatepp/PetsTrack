package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"github.com/sony/gobreaker" // <--- Import Circuit Breaker

	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

func initTracer(serviceName string) func(context.Context) error {
	exporter, err := otlptracehttp.New(context.Background(),
		otlptracehttp.WithEndpoint("jaeger:4318"),
		otlptracehttp.WithInsecure(),
	)
	if err != nil {
		log.Fatal(err)
	}
	res, _ := resource.New(context.Background(),
		resource.WithAttributes(semconv.ServiceNameKey.String(serviceName)),
	)
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))
	return tp.Shutdown
}

// --- สร้าง Custom Transport สำหรับ Circuit Breaker ---
type circuitBreakerTransport struct {
	cb *gobreaker.CircuitBreaker
	rt http.RoundTripper
}

// ดักจับ Request ขาออกเพื่อดูว่าปลายทางล่มหรือไม่
func (cbt *circuitBreakerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	result, err := cbt.cb.Execute(func() (interface{}, error) {
		resp, err := cbt.rt.RoundTrip(req)
		if err != nil {
			return nil, err // ปลายทางตาย (Connection Refused, Timeout)
		}
		if resp.StatusCode >= 500 {
			// ถ้าระบบปลายทางตอบ 500+ ถือว่าเป็น Error ให้ Circuit Breaker นับเป็นความล้มเหลว
			return resp, fmt.Errorf("server error: %d", resp.StatusCode)
		}
		return resp, nil
	})

	if err != nil {
		return nil, err
	}
	return result.(*http.Response), nil
}

// --- แก้ไข newProxy ให้รองรับ Circuit Breaker ---
func newProxy(targetURL string, serviceName string) gin.HandlerFunc {
	target, _ := url.Parse(targetURL)
	proxy := httputil.NewSingleHostReverseProxy(target)

	// 🌟 เพิ่ม Director เพื่อตัด Prefix ออกก่อนส่งให้ Service ปลายทาง
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		// ถ้ามี /user หรือ /pets ให้ตัดออกเพื่อให้ backend รับ /signup หรือ / เฉยๆ ได้
		if strings.HasPrefix(req.URL.Path, "/user") {
			req.URL.Path = strings.TrimPrefix(req.URL.Path, "/user")
		} else if strings.HasPrefix(req.URL.Path, "/pets") {
			req.URL.Path = strings.TrimPrefix(req.URL.Path, "/pets")
		}
	}
	// ตั้งค่า Circuit Breaker
	cb := gobreaker.NewCircuitBreaker(gobreaker.Settings{
		Name:        serviceName + "-CB",
		MaxRequests: 3,               // ยอมให้ทดลองส่ง Request ได้ 3 ครั้งตอนอยู่ในสถานะ Half-Open
		Timeout:     5 * time.Second, // ระยะเวลาที่ต้องรอก่อนจะลองยิงไป Service นั้นใหม่ (5 วิ)
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			// จะตัดวงจร (Trip) ก็ต่อเมื่อมี Request เกิน 3 ครั้ง และอัตราการพังเกิน 50%
			failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
			return counts.Requests >= 3 && failureRatio >= 0.5
		},
	})

	// เอา Circuit Breaker ไปครอบทับ Transport ของ OTel (Tracing) อีกที
	baseTransport := otelhttp.NewTransport(http.DefaultTransport)
	proxy.Transport = &circuitBreakerTransport{
		cb: cb,
		rt: baseTransport,
	}

	// สร้าง Error Handler เพื่อตอบผู้ใช้เวลาที่ Circuit Breaker ทำงาน หรือ Service พัง
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable) // HTTP 503

		if err == gobreaker.ErrOpenState {
			w.Write([]byte(fmt.Sprintf(`{"error": "Circuit Breaker OPEN: Service %s is currently unavailable."}`, serviceName)))
			return
		}
		w.Write([]byte(fmt.Sprintf(`{"error": "Service %s is down: %v"}`, serviceName, err)))
	}

	return func(c *gin.Context) {
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

func RequireAuth(c *gin.Context) {
	ctx, span := otel.Tracer("api-gateway").Start(c.Request.Context(), "RequireAuth")
	defer span.End()

	c.Request = c.Request.WithContext(ctx)

	tokenString, err := c.Cookie("Authorization")
	if err != nil {
		span.RecordError(err)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return []byte(os.Getenv("SECRET")), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	if err != nil || !token.Valid {
		span.RecordError(err)
		span.SetStatus(codes.Error, "Missing or invalid token")
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		if float64(time.Now().Unix()) > claims["exp"].(float64) {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		userID := claims["user_id"]
		c.Request.Header.Set("X-User-Id", fmt.Sprintf("%v", userID))
		c.Next()
	} else {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}
}

func main() {
	godotenv.Load()

	shutdown := initTracer("api-gateway")
	defer shutdown(context.Background())

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"}, // พอร์ตของ React Vite
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true, // สำคัญมาก! ต้องเป็น true เพื่อให้ส่ง Cookie ได้
		MaxAge:           12 * time.Hour,
	}))

	r.Use(otelgin.Middleware("api-gateway"))

	authServiceURL := os.Getenv("AUTH_SERVICE_URL")
	petServiceURL := os.Getenv("PET_SERVICE_URL")
	trackingServiceURL := os.Getenv("TRACKING_SERVICE_URL")
	notiServiceURL := "http://notification-service:8080"

	// ใส่ชื่อ Service กำกับไปตอนสร้าง Proxy ด้วย เพื่อให้ Circuit Breaker แยกการทำงานกัน
	authGroup := r.Group("/user")
	{
		authGroup.Any("/*path", newProxy(authServiceURL, "auth-service"))
	}

	petGroup := r.Group("/pets")
	petGroup.Use(RequireAuth)
	{
		petGroup.Any("/*path", newProxy(petServiceURL, "pet-management"))
	}

	trackingGroup := r.Group("/tracking")
	trackingGroup.Use(RequireAuth)
	{
		trackingGroup.Any("/*path", newProxy(trackingServiceURL, "tracking-service"))
	}

	wsGroup := r.Group("/ws")
	{
		wsGroup.Any("", newProxy(notiServiceURL, "notification-service"))
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // เผื่อกรณีลืมตั้ง PORT ใน .env
	}
	r.Run(":" + port)
}
