package services

import (
	"boilerplate-service/database"
	"boilerplate-service/grpcclient"
	"boilerplate-service/queue"
)

type Services struct {
	Database *database.Database
	Redis    *queue.RedisClient
	Kafka    *queue.KafkaClient
	GRPC     *grpcclient.Clients
}

func NewServices(db *database.Database, redis *queue.RedisClient, kafka *queue.KafkaClient, grpc *grpcclient.Clients) *Services {
	return &Services{
		Database: db,
		Redis:    redis,
		Kafka:    kafka,
		GRPC:     grpc,
	}
} 