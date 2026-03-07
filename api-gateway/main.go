package main

import(
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

func newProxy(targetURL string) gin.HandlerFunc {
	url, _ := url.Parse(targetURL)
	proxy := httputil.NewSingleHostReverseProxy(url)

	return func(c *gin.Context) {
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

func RequireAuth(c *gin.Context) {
	tokenString, err := c.Cookie("Authorization")
	if err != nil {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return []byte(os.Getenv("SECRET")), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	if err != nil || !token.Valid {
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

	r := gin.Default()

	authServiceURL := os.Getenv("AUTH_SERVICE_URL")
	petServiceURL := os.Getenv("PET_SERVICE_URL")

	authGroup := r.Group("/user")
	{
		authGroup.Any("/*path", newProxy(authServiceURL)) 
	}

	petGroup := r.Group("/pets")
	
	petGroup.Use(RequireAuth)
	{
		petGroup.Any("/*path", newProxy(petServiceURL))
	}

	port := os.Getenv("PORT")
	r.Run(":" + port)
}
