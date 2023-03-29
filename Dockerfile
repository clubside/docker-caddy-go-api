FROM golang:1.19

WORKDIR /app

RUN go install github.com/cosmtrek/air@latest

COPY go.mod ./
RUN go mod download

CMD ["air", "-c", ".air.toml"]

