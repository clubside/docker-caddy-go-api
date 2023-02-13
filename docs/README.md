# Windows, Docker, Caddy and localhost
This tutorial will walk you through a number of tasks to realize this development environment:
1. Create a Go-based Application Programming Interface with multiple routes
2. Add support for static content including a Single Page App
3. Create an SPA that accesses the API to grab web pages and display an OpenGraph-based link if available
4. Switch to Caddy Server to handle static content
5. Use a `Caddyfile` to reverse proxy the API and support SPA internal routing
6. Put both Go and Caddy into a Docker container
7. Add Air for automatic updating of the Go API while the container is active
8. Expose the Caddy Admin API to the Docker Host to add HTTPS

I began this journey with Joe Purdy's [My Go development environment with HTTPS and Dynamic Reloading](https://www.purdy.dev/words/basic-go-development-environment-with-https-and-dynamic-reloading/) but I ran into some issues mostly tied to differences in host (Windows vs. Linux) and scope (SPA vs. simple API).
