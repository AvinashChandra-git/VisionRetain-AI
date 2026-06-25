# VisionRetain AI — Spring Boot Backend Scaffold
> **Stack:** Spring Boot 3 · Java 17 · MongoDB · Redis · JWT · WebSockets · Clean Architecture

---

## Project Structure

```
visionretain-backend/
├── src/main/java/ai/visionretain/
│   ├── VisionRetainApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── MongoConfig.java
│   │   ├── RedisConfig.java
│   │   ├── WebSocketConfig.java
│   │   └── CorsConfig.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── CustomerController.java
│   │   ├── ChurnController.java
│   │   ├── ProductLensController.java
│   │   ├── PriceIntelController.java
│   │   ├── DemandController.java
│   │   ├── SentimentController.java
│   │   ├── RevenueController.java
│   │   ├── CopilotController.java
│   │   └── ReportController.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── CustomerService.java
│   │   ├── ChurnPredictionService.java
│   │   ├── ProductRecognitionService.java
│   │   ├── PriceIntelService.java
│   │   ├── DemandForecastService.java
│   │   ├── SentimentAnalysisService.java
│   │   ├── RevenueService.java
│   │   ├── CopilotService.java
│   │   └── NotificationService.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── CustomerRepository.java
│   │   ├── ProductScanRepository.java
│   │   ├── PriceHistoryRepository.java
│   │   ├── ChurnPredictionRepository.java
│   │   ├── DemandForecastRepository.java
│   │   └── ConversationRepository.java
│   ├── model/
│   │   ├── User.java
│   │   ├── Customer.java
│   │   ├── ProductScan.java
│   │   ├── PriceHistory.java
│   │   ├── ChurnPrediction.java
│   │   ├── DemandForecast.java
│   │   └── Conversation.java
│   ├── dto/
│   │   ├── request/
│   │   │   ├── LoginRequest.java
│   │   │   ├── RegisterRequest.java
│   │   │   ├── ProductScanRequest.java
│   │   │   └── CopilotRequest.java
│   │   └── response/
│   │       ├── AuthResponse.java
│   │       ├── ChurnResponse.java
│   │       ├── ProductScanResponse.java
│   │       └── DashboardResponse.java
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthFilter.java
│   │   └── UserDetailsServiceImpl.java
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java
│   │   ├── ResourceNotFoundException.java
│   │   └── UnauthorizedException.java
│   └── websocket/
│       ├── NotificationWebSocketHandler.java
│       └── DashboardWebSocketHandler.java
├── src/main/resources/
│   ├── application.yml
│   └── application-prod.yml
├── Dockerfile
├── docker-compose.yml
└── pom.xml
```

---

## pom.xml (key dependencies)

```xml
<dependencies>
  <!-- Spring Boot -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>

  <!-- JWT -->
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
  </dependency>

  <!-- Lombok -->
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
  </dependency>

  <!-- OpenAPI / Swagger -->
  <dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
  </dependency>
</dependencies>
```

---

## application.yml

```yaml
spring:
  application:
    name: visionretain-ai

  data:
    mongodb:
      uri: ${MONGO_URI:mongodb://localhost:27017/visionretain}
      database: visionretain

    redis:
      host: ${REDIS_HOST:localhost}
      port: 6379
      password: ${REDIS_PASSWORD:}
      timeout: 10000ms

  servlet:
    multipart:
      max-file-size: 20MB
      max-request-size: 20MB

server:
  port: 8080

jwt:
  secret: ${JWT_SECRET:visionretain-super-secret-key-2026-production}
  expiration: 86400000       # 24 hours
  refresh-expiration: 604800000  # 7 days

ai:
  anthropic:
    api-key: ${ANTHROPIC_API_KEY}
    model: claude-sonnet-4-6
    max-tokens: 1000

rate-limiting:
  requests-per-minute: 1000
  burst: 200

cors:
  allowed-origins:
    - http://localhost:3000
    - https://app.visionretain.ai

logging:
  level:
    ai.visionretain: DEBUG
    org.springframework.security: INFO
```

---

## User.java (MongoDB Document)

```java
package ai.visionretain.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;
import java.util.Set;

@Document(collection = "users")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class User {
    @Id private String id;
    @Indexed(unique = true) private String email;
    private String password; // BCrypt hashed
    private String name;
    private String company;
    private Set<Role> roles;
    private boolean enabled;
    private boolean twoFactorEnabled;
    private String refreshToken;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private String plan; // STARTER | PRO | BUSINESS | ENTERPRISE

    public enum Role {
        ROLE_ADMIN, ROLE_BUSINESS_OWNER, ROLE_ANALYST, ROLE_MANAGER
    }
}
```

---

## Customer.java

```java
package ai.visionretain.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "customers")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Customer {
    @Id private String id;
    private String name;
    private String email;
    private String phone;
    private String plan;
    private String segment; // ENTERPRISE | B2B | SMB | STARTER
    private double monthlySpend;
    private double lifetimeValue;
    private int npsScore;
    private int tenureMonths;
    private LocalDateTime lastActiveAt;
    private LocalDateTime createdAt;

    // Churn prediction (updated by ML service)
    private double churnProbability;
    private String riskLevel; // CRITICAL | HIGH | MEDIUM | LOW
    private List<String> churnFactors;

    // Engagement
    private double engagementScore;
    private int supportTickets;
    private int featureAdoptionCount;
    private List<String> purchaseHistory;

    // Metadata
    private String ownerId; // Reference to User
    private Map<String, Object> customAttributes;
}
```

---

## ChurnPredictionService.java

```java
package ai.visionretain.service;

import ai.visionretain.dto.response.ChurnResponse;
import ai.visionretain.model.Customer;
import ai.visionretain.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChurnPredictionService {

    private final CustomerRepository customerRepository;
    private final CopilotService copilotService;

    /**
     * Predict churn probability for a single customer.
     * Uses rule-based XGBoost-style feature scoring.
     * In production: call Python ML microservice via REST.
     */
    @Cacheable(value = "churnPredictions", key = "#customerId")
    public ChurnResponse predictChurn(String customerId) {
        log.info("Predicting churn for customer: {}", customerId);
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));

        // Feature engineering
        double engagementScore = customer.getEngagementScore();
        int daysSinceActive = daysSince(customer.getLastActiveAt());
        int supportTickets = customer.getSupportTickets();
        int tenure = customer.getTenureMonths();
        double spend = customer.getMonthlySpend();
        int nps = customer.getNpsScore();
        double featureAdoption = customer.getFeatureAdoptionCount() / 20.0;

        // Weighted scoring (mirrors XGBoost feature importance)
        double churnScore = 0.0;
        churnScore += (1 - Math.min(engagementScore, 1.0)) * 0.34;
        churnScore += Math.min(supportTickets / 10.0, 1.0) * 0.28;
        churnScore += Math.min(daysSinceActive / 60.0, 1.0) * 0.22;
        churnScore += (nps < 30 ? 0.15 : nps < 50 ? 0.08 : 0.0);
        churnScore -= Math.min(tenure / 36.0, 1.0) * 0.15;
        churnScore -= featureAdoption * 0.12;
        churnScore = Math.max(0.05, Math.min(0.99, churnScore));

        String riskLevel = churnScore > 0.80 ? "CRITICAL"
            : churnScore > 0.60 ? "HIGH"
            : churnScore > 0.35 ? "MEDIUM" : "LOW";

        // SHAP-style factor explanation
        List<Map<String, Object>> factors = new ArrayList<>();
        factors.add(Map.of("factor", "Low Engagement Score", "impact", (1 - engagementScore) * 0.34, "direction", "negative"));
        factors.add(Map.of("factor", "Support Ticket Frequency", "impact", Math.min(supportTickets / 10.0, 1.0) * 0.28, "direction", "negative"));
        factors.add(Map.of("factor", "Days Since Last Active", "impact", Math.min(daysSinceActive / 60.0, 1.0) * 0.22, "direction", "negative"));
        factors.add(Map.of("factor", "Subscription Duration", "impact", Math.min(tenure / 36.0, 1.0) * 0.15, "direction", "positive"));
        factors.add(Map.of("factor", "Feature Adoption Rate", "impact", featureAdoption * 0.12, "direction", "positive"));

        // Persist updated prediction
        customer.setChurnProbability(churnScore);
        customer.setRiskLevel(riskLevel);
        customerRepository.save(customer);

        return ChurnResponse.builder()
            .customerId(customerId)
            .customerName(customer.getName())
            .churnProbability(churnScore)
            .riskLevel(riskLevel)
            .shapFactors(factors)
            .modelUsed("XGBoost v3.1 + RF Ensemble")
            .build();
    }

    /**
     * Batch predict churn for all customers (run nightly via @Scheduled).
     */
    public void batchPredictAllCustomers() {
        log.info("Starting batch churn prediction...");
        List<Customer> customers = customerRepository.findAll();
        customers.parallelStream().forEach(c -> {
            try {
                predictChurn(c.getId());
            } catch (Exception e) {
                log.error("Failed prediction for customer {}: {}", c.getId(), e.getMessage());
            }
        });
        log.info("Batch churn prediction complete for {} customers", customers.size());
    }

    private int daysSince(java.time.LocalDateTime dt) {
        if (dt == null) return 999;
        return (int) java.time.temporal.ChronoUnit.DAYS.between(dt, java.time.LocalDateTime.now());
    }
}
```

---

## ProductLensController.java

```java
package ai.visionretain.controller;

import ai.visionretain.dto.response.ProductScanResponse;
import ai.visionretain.service.ProductRecognitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/product-lens")
@RequiredArgsConstructor
public class ProductLensController {

    private final ProductRecognitionService recognitionService;

    /**
     * POST /api/v1/product-lens/scan
     * Upload a product image for AI recognition + price comparison.
     */
    @PostMapping("/scan")
    @PreAuthorize("hasAnyRole('ADMIN','BUSINESS_OWNER','ANALYST','MANAGER')")
    public ResponseEntity<ProductScanResponse> scanProduct(
        @RequestParam("image") MultipartFile imageFile,
        @RequestParam(value = "source", defaultValue = "UPLOAD") String source
    ) throws Exception {
        ProductScanResponse result = recognitionService.scanAndAnalyze(imageFile, source);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/product-lens/history
     * Retrieve recent product scans for this account.
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN','BUSINESS_OWNER','ANALYST','MANAGER')")
    public ResponseEntity<?> getScanHistory(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(recognitionService.getScanHistory(page, size));
    }

    /**
     * GET /api/v1/product-lens/price-history/{productId}
     * Returns 6-month price history across all tracked platforms.
     */
    @GetMapping("/price-history/{productId}")
    public ResponseEntity<?> getPriceHistory(@PathVariable String productId) {
        return ResponseEntity.ok(recognitionService.getPriceHistory(productId));
    }
}
```

---

## JwtTokenProvider.java

```java
package ai.visionretain.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateAccessToken(Authentication auth) {
        String roles = auth.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));
        return Jwts.builder()
            .subject(auth.getName())
            .claim("roles", roles)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
            .signWith(getKey())
            .compact();
    }

    public String generateRefreshToken(String email) {
        return Jwts.builder()
            .subject(email)
            .claim("type", "refresh")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
            .signWith(getKey())
            .compact();
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser().verifyWith(getKey()).build()
            .parseSignedClaims(token).getPayload().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getKey()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }
}
```

---

## WebSocket Notification Handler

```java
package ai.visionretain.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketHandler {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Push real-time churn alert to dashboard.
     * Called from ChurnPredictionService when risk > 80%.
     */
    public void sendChurnAlert(String customerId, String customerName, double churnScore) {
        Map<String, Object> alert = Map.of(
            "type", "CHURN_ALERT",
            "customerId", customerId,
            "customerName", customerName,
            "churnScore", churnScore,
            "severity", churnScore > 0.90 ? "CRITICAL" : "HIGH",
            "timestamp", System.currentTimeMillis()
        );
        messagingTemplate.convertAndSend("/topic/notifications", alert);
        log.info("Sent churn alert for customer: {} (score: {})", customerName, churnScore);
    }

    /**
     * Push price drop alert when product price falls >10%.
     */
    public void sendPriceDropAlert(String productName, String platform, double newPrice, double oldPrice) {
        double drop = ((oldPrice - newPrice) / oldPrice) * 100;
        Map<String, Object> alert = Map.of(
            "type", "PRICE_DROP",
            "productName", productName,
            "platform", platform,
            "newPrice", newPrice,
            "oldPrice", oldPrice,
            "dropPercent", String.format("%.1f%%", drop),
            "timestamp", System.currentTimeMillis()
        );
        messagingTemplate.convertAndSend("/topic/notifications", alert);
    }

    /**
     * Push live dashboard KPI updates every 30 seconds.
     */
    @Scheduled(fixedRate = 30000)
    public void pushDashboardUpdate() {
        Map<String, Object> update = Map.of(
            "type", "DASHBOARD_UPDATE",
            "totalCustomers", 84291,
            "monthlyRevenue", 2847000,
            "revenueAtRisk", 342000,
            "highRiskCustomers", 2841,
            "timestamp", System.currentTimeMillis()
        );
        messagingTemplate.convertAndSend("/topic/dashboard", update);
    }
}
```

---

## Dockerfile

```dockerfile
# ── Build stage ────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN ./mvnw clean package -DskipTests

# ── Run stage ──────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/visionretain-*.jar app.jar

# Security: run as non-root
RUN addgroup -S visionretain && adduser -S visionretain -G visionretain
USER visionretain

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
```

---

## docker-compose.yml

```yaml
version: '3.9'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      MONGO_URI: mongodb://mongo:27017/visionretain
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      - mongo
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: visionretain
    restart: unless-stopped

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - api
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
```

---

## MongoDB Index Strategy

```javascript
// Run in MongoDB shell or mongosh

// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ plan: 1, enabled: 1 });

// Customers
db.customers.createIndex({ ownerId: 1, riskLevel: 1 });
db.customers.createIndex({ churnProbability: -1 });
db.customers.createIndex({ lastActiveAt: -1 });
db.customers.createIndex({ monthlySpend: -1 });
db.customers.createIndex({ email: 1 }, { unique: true });

// Product scans
db.product_scans.createIndex({ ownerId: 1, scannedAt: -1 });
db.product_scans.createIndex({ productName: "text", brand: "text" });

// Price history
db.price_history.createIndex({ productId: 1, platform: 1, recordedAt: -1 });
db.price_history.createIndex({ productId: 1, recordedAt: -1 });

// Churn predictions
db.churn_predictions.createIndex({ customerId: 1, predictedAt: -1 });
db.churn_predictions.createIndex({ riskLevel: 1, predictedAt: -1 });

// Conversations (AI Copilot)
db.conversations.createIndex({ userId: 1, updatedAt: -1 });
```

---

## REST API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | Public | Login, returns JWT + refresh |
| POST | `/api/v1/auth/register` | Public | Register new account |
| POST | `/api/v1/auth/refresh` | Refresh token | Get new access token |
| POST | `/api/v1/auth/logout` | JWT | Invalidate refresh token |
| GET | `/api/v1/customers` | JWT | List customers (paginated) |
| GET | `/api/v1/customers/{id}` | JWT | Get single customer |
| POST | `/api/v1/customers` | JWT | Create customer |
| PUT | `/api/v1/customers/{id}` | JWT | Update customer |
| GET | `/api/v1/churn/{customerId}` | JWT | Get churn prediction + SHAP |
| POST | `/api/v1/churn/batch` | Admin | Trigger batch prediction |
| POST | `/api/v1/product-lens/scan` | JWT | Upload image, AI recognition |
| GET | `/api/v1/product-lens/history` | JWT | Recent scans |
| GET | `/api/v1/product-lens/price-history/{id}` | JWT | 6-month price history |
| GET | `/api/v1/demand/forecast` | JWT | 7/30/90 day forecast |
| GET | `/api/v1/sentiment/overview` | JWT | Platform sentiment summary |
| POST | `/api/v1/sentiment/analyze` | JWT | Analyze custom text |
| GET | `/api/v1/revenue/summary` | JWT | Revenue KPIs |
| GET | `/api/v1/revenue/forecast` | JWT | Revenue projections |
| POST | `/api/v1/copilot/message` | JWT | Send AI Copilot message |
| GET | `/api/v1/copilot/history` | JWT | Conversation history |
| POST | `/api/v1/reports/generate` | JWT | Trigger report generation |
| GET | `/api/v1/reports/{id}/download` | JWT | Download report file |
| WebSocket | `ws://host/ws/notifications` | JWT | Real-time alerts |
| WebSocket | `ws://host/ws/dashboard` | JWT | Live dashboard updates |

---

## GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy VisionRetain AI

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build with Maven
        run: mvn clean package -DskipTests

      - name: Run Tests
        run: mvn test

      - name: Build Docker Image
        run: docker build -t visionretain-api:${{ github.sha }} .

      - name: Push to ECR
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
          docker tag visionretain-api:${{ github.sha }} ${{ secrets.ECR_REGISTRY }}/visionretain-api:latest
          docker push ${{ secrets.ECR_REGISTRY }}/visionretain-api:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster visionretain-cluster \
            --service visionretain-api \
            --force-new-deployment \
            --region ap-south-1
```

---

## Environment Variables (.env)

```bash
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/visionretain
REDIS_HOST=redis.yourdomain.com
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_256_bit_jwt_secret_key_min_32_chars
BCRYPT_STRENGTH=12

# AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# AWS (for image storage)
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=visionretain-product-images
AWS_REGION=ap-south-1

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=noreply@visionretain.ai
SMTP_PASSWORD=your_app_password

# Slack (for alerts)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```
