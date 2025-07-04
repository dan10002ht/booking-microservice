# Internal Modules

Thư mục `internal/` chứa các module nội bộ của email-worker service, được tách ra từ file `main.go` gốc để dễ quản lý và maintain.

## Cấu trúc

```
internal/
├── app/          # Logic khởi tạo và chạy ứng dụng chính
├── config/       # Logic load và quản lý configuration
├── logger/       # Logic khởi tạo logger
└── server/       # Logic HTTP server và endpoints
```

## Modules

### app/

- **app.go**: Chứa logic khởi tạo tất cả components (database, repositories, services, queue, processor)
- Quản lý lifecycle của ứng dụng (start/stop)
- Xử lý graceful shutdown

### config/

- **loader.go**: Logic load configuration từ file và environment variables
- Set default values
- Bind environment variables

### logger/

- **logger.go**: Logic khởi tạo zap logger
- Cấu hình log level và output path

### server/

- **server.go**: HTTP server với các endpoints:
  - `/health`: Health check
  - `/metrics`: Prometheus metrics
  - `/stats`: Application statistics
  - `/queue/size`: Queue size information

## Lợi ích của việc tách module

1. **Dễ maintain**: Mỗi module có trách nhiệm rõ ràng
2. **Dễ test**: Có thể test từng module riêng biệt
3. **Dễ mở rộng**: Thêm tính năng mới không ảnh hưởng module khác
4. **Code sạch**: File `main.go` chỉ còn 50 dòng thay vì 300+ dòng
5. **Separation of concerns**: Mỗi module tập trung vào một chức năng

## Sử dụng

File `main.go` mới rất đơn giản:

```go
func main() {
    // Initialize logger
    logger := logger.InitLogger()

    // Load config
    cfg := config.LoadConfig()

    // Initialize app
    app := app.NewApp(logger, cfg)
    app.Initialize()

    // Start server
    server := server.NewServer(logger, app.GetEmailProcessor(), cfg.Server.Port)
    server.Start()

    // Run app
    app.Run()
}
```
