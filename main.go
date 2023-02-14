package main

import (
	"fmt"
	"io"
	"io/fs"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

func main() {
	http.HandleFunc("/api/v1/key", serviceKey)
	http.HandleFunc("/api/v1/og", serviceOpenGraph)

	var frontend fs.FS = os.DirFS("public")
	httpFS := http.FS(frontend)
	fileServer := http.FileServer(httpFS)
	serveIndex := serveFileContents("index.html", httpFS)

	http.Handle("/", intercept404(fileServer, serveIndex))

	fmt.Println("SPA API Server")
	fmt.Printf("Starting API on %s\n", time.Now().Format("Jan 02, 2006 15:04 MST"))
	log.Fatalln(http.ListenAndServe(":3000", nil))
}

func intercept404(handler, on404 http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hookedWriter := &hookedResponseWriter{ResponseWriter: w}
		handler.ServeHTTP(hookedWriter, r)

		if hookedWriter.got404 {
			on404.ServeHTTP(w, r)
		}
	})
}

type hookedResponseWriter struct {
	http.ResponseWriter
	got404 bool
}

func (hrw *hookedResponseWriter) WriteHeader(status int) {
	if status == http.StatusNotFound {
		// Don't actually write the 404 header, just set a flag.
		hrw.got404 = true
	} else {
		hrw.ResponseWriter.WriteHeader(status)
	}
}

func (hrw *hookedResponseWriter) Write(p []byte) (int, error) {
	if hrw.got404 {
		// No-op, but pretend that we wrote len(p) bytes to the writer.
		return len(p), nil
	}

	return hrw.ResponseWriter.Write(p)
}

func serveFileContents(file string, files http.FileSystem) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Restrict only to instances where the browser is looking for an HTML file
		if !strings.Contains(r.Header.Get("Accept"), "text/html") {
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprint(w, "404 not found")

			return
		}

		// Open the file and return its contents using http.ServeContent
		index, err := files.Open(file)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprintf(w, "%s not found", file)

			return
		}

		fi, err := index.Stat()
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprintf(w, "%s not found", file)

			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		http.ServeContent(w, r, fi.Name(), fi.ModTime(), index)
	}
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
