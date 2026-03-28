package main

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"time"
	"context"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/codes"
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

func newProxy(targetURL string) gin.HandlerFunc {
	url, _ := url.Parse(targetURL)
	proxy := httputil.NewSingleHostReverseProxy(url)

	proxy.Transport = otelhttp.NewTransport(http.DefaultTransport)

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

	r.Use(otelgin.Middleware("api-gateway"))

	authServiceURL := os.Getenv("AUTH_SERVICE_URL")
	petServiceURL := os.Getenv("PET_SERVICE_URL")
	trackingServiceURL := os.Getenv("TRACKING_SERVICE_URL")

	authGroup := r.Group("/user")
	{
		authGroup.Any("/*path", newProxy(authServiceURL))
	}

	petGroup := r.Group("/pets")

	petGroup.Use(RequireAuth)
	{
		petGroup.Any("/*path", newProxy(petServiceURL))
	}

	trackingGroup := r.Group("/tracking")
	trackingGroup.Use(RequireAuth)
	{
		// จะส่งต่อทุก Request ที่ขึ้นต้นด้วย /tracking ไปยัง Tracking Service
		trackingGroup.Any("/*path", newProxy(trackingServiceURL))
	}

	notiServiceURL := "http://notification-service:8080"

	wsGroup := r.Group("/ws")
	{
		// ให้ Gateway ส่งต่อการเชื่อมต่อ WebSocket ไปที่ Noti Service
		wsGroup.Any("", newProxy(notiServiceURL))
	}

	port := os.Getenv("PORT")
	r.Run(":" + port)
}
