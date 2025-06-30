package queue

import (
	"context"
	"fmt"

	"boilerplate-service/config"

	"github.com/segmentio/kafka-go"
)

type KafkaClient struct {
	reader *kafka.Reader
	writer *kafka.Writer
}

func NewKafkaClient(cfg config.KafkaConfig) (*KafkaClient, error) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{cfg.BootstrapServers},
		GroupID: cfg.GroupID,
		Topic:   cfg.Topics["events"],
	})

	writer := &kafka.Writer{
		Addr:     kafka.TCP(cfg.BootstrapServers),
		Balancer: &kafka.LeastBytes{},
	}

	return &KafkaClient{
		reader: reader,
		writer: writer,
	}, nil
}

func (k *KafkaClient) Close() error {
	if err := k.reader.Close(); err != nil {
		return fmt.Errorf("failed to close kafka reader: %w", err)
	}
	if err := k.writer.Close(); err != nil {
		return fmt.Errorf("failed to close kafka writer: %w", err)
	}
	return nil
}

func (k *KafkaClient) ReadMessage(ctx context.Context) (kafka.Message, error) {
	return k.reader.ReadMessage(ctx)
}

func (k *KafkaClient) WriteMessage(ctx context.Context, topic string, key, value []byte) error {
	return k.writer.WriteMessages(ctx, kafka.Message{
		Topic: topic,
		Key:   key,
		Value: value,
	})
} 