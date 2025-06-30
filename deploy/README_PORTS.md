# Custom Service Ports for Local Development (WSL2)

Để tránh xung đột với các cổng mặc định trên WSL2/Ubuntu, các service trong docker-compose.dev.yml đã được đổi port như sau:

| Service       | Host Port | Container Port | Ghi chú          |
| ------------- | --------- | -------------- | ---------------- |
| Postgres      | 55432     | 5432           | Database         |
| Redis         | 56379     | 6379           | Cache            |
| Zookeeper     | 52181     | 2181           | Kafka dependency |
| Kafka         | 59092     | 9092           | Message broker   |
| Prometheus    | 59090     | 9090           | Metrics          |
| Grafana       | 53001     | 3000           | Dashboard        |
| Elasticsearch | 59200     | 9200           | Search engine    |
| Kibana        | 55601     | 5601           | Elasticsearch UI |
| Gateway       | 53000     | 3000           | API Gateway      |

**Lưu ý:**

- Khi kết nối tới các service từ máy host, hãy sử dụng Host Port ở trên.
- Nếu bạn cần thêm service mới, nên chọn port cao (trên 50000) để tránh xung đột.
