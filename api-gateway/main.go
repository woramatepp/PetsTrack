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
	"github.com/sony/gobreaker"

	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

// initTracer ตั้งค่า OpenTelemetry สำหรับการทำ Distributed Tracing
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

// circuitBreakerTransport สำหรับจัดการความยืดหยุ่นของระบบเมื่อ Microservice ปลายทางล่ม
type circuitBreakerTransport struct {
	cb *gobreaker.CircuitBreaker
	rt http.RoundTripper
}

func (cbt *circuitBreakerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	result, err := cbt.cb.Execute(func() (interface{}, error) {
		resp, err := cbt.rt.RoundTrip(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode >= 500 {
			return resp, fmt.Errorf("server error: %d", resp.StatusCode)
		}
		return resp, nil
	})

	if err != nil {
		return nil, err
	}
	return result.(*http.Response), nil
}

// newProxy สร้าง Reverse Proxy พร้อมตัด Prefix (/user, /pets) ออกก่อนส่งต่อ
func newProxy(targetURL string, serviceName string) gin.HandlerFunc {
	target, _ := url.Parse(targetURL)
	proxy := httputil.NewSingleHostReverseProxy(target)

	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		// ตัด Prefix เพื่อให้ Service ปลายทางได้รับ Path ที่ถูกต้อง
		if strings.HasPrefix(req.URL.Path, "/user") {
			req.URL.Path = strings.TrimPrefix(req.URL.Path, "/user")
		} else if strings.HasPrefix(req.URL.Path, "/pets") {
			req.URL.Path = strings.TrimPrefix(req.URL.Path, "/pets")
		} else if strings.HasPrefix(req.URL.Path, "/tracking") {
			req.URL.Path = strings.TrimPrefix(req.URL.Path, "/tracking")
		}

		// หาก Path ว่างให้ตั้งเป็น root
		if req.URL.Path == "" {
			req.URL.Path = "/"
		}
	}

	cb := gobreaker.NewCircuitBreaker(gobreaker.Settings{
		Name:        serviceName + "-CB",
		MaxRequests: 3,
		Timeout:     5 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
			return counts.Requests >= 3 && failureRatio >= 0.5
		},
	})

	baseTransport := otelhttp.NewTransport(http.DefaultTransport)
	proxy.Transport = &circuitBreakerTransport{
		cb: cb,
		rt: baseTransport,
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
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

// RequireAuth ตรวจสอบความถูกต้องของ JWT Token จากทั้ง Header และ Cookie
func RequireAuth(c *gin.Context) {
	ctx, span := otel.Tracer("api-gateway").Start(c.Request.Context(), "RequireAuth")
	defer span.End()

	c.Request = c.Request.WithContext(ctx)

	var tokenString string

	// 1. ดึงจาก Header "Authorization: Bearer <token>" (สำหรับ Frontend)
	authHeader := c.GetHeader("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString = strings.TrimPrefix(authHeader, "Bearer ")
	}

	// 2. ดึงจาก Cookie (เผื่อใช้กับหน้าเว็บแบบเดิม)
	if tokenString == "" {
		if cookie, err := c.Cookie("Authorization"); err == nil {
			tokenString = cookie
		}
	}

	if tokenString == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Missing Token"})
		return
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return []byte(os.Getenv("SECRET")), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	if err != nil || !token.Valid {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Invalid Token"})
		return
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		if float64(time.Now().Unix()) > claims["exp"].(float64) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Token Expired"})
			return
		}
		userID := claims["user_id"]
		c.Request.Header.Set("X-User-Id", fmt.Sprintf("%v", userID))
		c.Next()
	} else {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
}

func main() {
	godotenv.Load()

	shutdown := initTracer("api-gateway")
	defer shutdown(context.Background())

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Use(otelgin.Middleware("api-gateway"))

	authServiceURL := os.Getenv("AUTH_SERVICE_URL")
	petServiceURL := os.Getenv("PET_SERVICE_URL")
	trackingServiceURL := os.Getenv("TRACKING_SERVICE_URL")
	notiServiceURL := "http://notification-service:8080"

	// 1. Auth Group
	authGroup := r.Group("/user")
	{
		authGroup.Any("/*path", newProxy(authServiceURL, "auth-service"))
	}

	// 2. Pets Group (ใช้ RequireAuth ครอบคลุมทั้งดึงข้อมูลและเพิ่มข้อมูล)
	petGroup := r.Group("/pets")
	petGroup.Use(RequireAuth)
	{
		petGroup.Any("/*path", newProxy(petServiceURL, "pet-management"))
	}

	// 3. Tracking Group
	trackingGroup := r.Group("/tracking")
	trackingGroup.Use(RequireAuth)
	{
		trackingGroup.Any("/*path", newProxy(trackingServiceURL, "tracking-service"))
	}

	// 4. WebSocket Group
	wsGroup := r.Group("/ws")
	{
		wsGroup.Any("", newProxy(notiServiceURL, "notification-service"))
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
