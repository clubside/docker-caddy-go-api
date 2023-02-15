package main

import (
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"time"
)

func main() {
	http.HandleFunc("/api/v1/key", serviceKey)
	http.HandleFunc("/api/v1/og", serviceOpenGraph)

	fmt.Println("SPA API Server")
	fmt.Printf("Starting API on %s\n", time.Now().Format("Jan 02, 2006 15:04 MST"))
	log.Fatalln(http.ListenAndServe(":3000", nil))
}

func serviceKey(w http.ResponseWriter, r *http.Request) {
	paramLength := r.URL.Query().Get("length")
	if paramLength == "" {
		w.Write([]byte("no length parameter provided"))
		return
	}

	length, err := strconv.Atoi(paramLength)
	if err != nil {
		w.Write([]byte("invalid length parameter: " + paramLength))
		return
	}

	digits := "0123456789"
	specials := "~=+%^*!@#$"
	all := "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
		"abcdefghijklmnopqrstuvwxyz" +
		digits + specials
	buf := make([]byte, length)
	buf[0] = digits[rand.Intn(len(digits))]
	buf[1] = specials[rand.Intn(len(specials))]
	for i := 2; i < length; i++ {
		buf[i] = all[rand.Intn(len(all))]
	}
	rand.Shuffle(len(buf), func(i, j int) {
		buf[i], buf[j] = buf[j], buf[i]
	})

	w.Write(buf)
}

func serviceOpenGraph(w http.ResponseWriter, r *http.Request) {
	paramURL := r.URL.Query().Get("url")
	if paramURL == "" {
		w.Write([]byte("no url parameter provided"))
		return
	}

	req, err := http.NewRequest("GET", paramURL, nil)
	if err != nil {
		errString := "url get error: " + err.Error()
		w.Write([]byte(errString))
		return
	}

	cli := http.Client{}
	res, err := cli.Do(req)
	if err != nil {
		errString := "http client error: " + err.Error()
		w.Write([]byte(errString))
		return
	}

	if res.StatusCode < 200 || res.StatusCode > 299 {
		errString := "http status error: " + res.Status
		w.Write([]byte(errString))
		return
	}

	body, err := io.ReadAll(res.Body)
	res.Body.Close()
	if err != nil {
		errString := "http body error: " + err.Error()
		w.Write([]byte(errString))
		return
	}

	w.Write([]byte(body))
}
