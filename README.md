# Vanilla Browser OpenTelemetry with Elastic Observability

This project demonstrates a minimal, framework-agnostic example of capturing browser telemetry using OpenTelemetry and sending it to Elastic Observability. It walks through a progression from manual instrumentation, to automatic instrumentation, and a final hybrid approach, showing each step in action. Accompanying slides may be found [here](slides/Linuxfest%20Northwest%20-%20Observability%20is%20for%20Frontend,%20Too!.pdf).

## Why This Architecture?

This demo uses a **simplified two-service architecture** designed for learning:

- ✅ **Browser → OTel Collector → Elastic** - Clear, linear data flow
- ✅ **Vendor-neutral** - Uses OTLP standard, works with any OTLP-compatible backend
- ✅ **Minimal infrastructure** - Just Docker Compose with 2 services
- ✅ **Production patterns** - BatchSpanProcessor, context propagation, CORS handling
- ✅ **Focus on code** - Less infrastructure complexity, more instrumentation examples

The OpenTelemetry Collector handles CORS directly (no reverse proxy needed), making this setup easy to understand and reproduce while still demonstrating production-ready patterns.

## 1. Installation

```bash
# Clone the repository
git clone https://github.com/justincastilla/vanilla-browser-otel.git
cd vanilla-browswer-otel
npm install
```



## 2. Getting API Keys and Endpoints

You will need credentials for Elastic APM to send telemetry data. Here's how:

1. Log into your [Elastic Cloud Console](https://cloud.elastic.co/).
2. Create or select an existing deployment optimized for Observability.
3. Navigate to **Observability > APM** and note the following:
   - APM Server URL (e.g., `https://<your-deployment>.apm.us-central1.gcp.elastic-cloud.com`)
   - API Key for sending data securely
4. Create a `.env` file in your root directory and copy from `.env.example`:

```bash
cp .env.example .env
```

Then fill in the values:
```bash
ELASTIC_ENDPOINT='https://<your-deployment>.apm.us-central1.gcp.elastic-cloud.com'
ELASTIC_TOKEN='ApiKey your-token-here'
WEATHER_API_KEY='your-weather-api-key-here'
```

**Important**: The `ELASTIC_TOKEN` must be in the format `ApiKey <your-token>`, not `Bearer <your-token>`.



## 3. Breakdown of components

### Parcel (Frontend Dev Server)
Parcel is a fast, zero-config bundler that compiles and serves the frontend JavaScript (like app.js) and HTML (like index.html). It ensures that modern JavaScript syntax works across browsers and provides hot module reloading.

### OpenTelemetry SDK
The frontend uses the OpenTelemetry Web SDK with `BatchSpanProcessor` to batch telemetry spans together before sending them to the collector every 1 second. This prevents overwhelming the collector's queue with individual span exports.

### OpenTelemetry Collector
The OTEL Collector receives telemetry data directly from the browser via HTTP on port 4318. It has CORS enabled to accept requests from localhost:1234. The collector then exports traces to Elastic APM using the OTLP exporter. This architecture:
- Uses the vendor-neutral OTLP standard
- Decouples browser instrumentation from the observability backend
- Allows for data processing/filtering before export
- Demonstrates production-ready patterns in a simple setup


## 4. Running the Project & Viewing Examples

Ensure your docker container service is started. Run all services using Docker Compose:
```bash
docker-compose up
```

This single command starts:
- Frontend Parcel dev server on port 1234
- OpenTelemetry Collector on port 4318 (with CORS enabled)

The application serves `index.html` and bundles `app.js`, which contains various buttons and inputs that emit OpenTelemetry spans based on different types of instrumentation.

Open the browser to `http://localhost:1234` and interact with the UI elements. The telemetry log on the right side shows real-time trace and span information as you click buttons, adjust the slider, or fetch weather data. You can also check the browser devtools Network tab to view traces being sent to the collector.


## 5. Exploring Manual and Automatic Instrumentation Progression

To understand the progression of OpenTelemetry instrumentation, follow this step-by-step:

### Step 1: **Manual Instrumentation Only**
- In `app.js`, **comment out** all `registerInstrumentations()` calls.
- Trigger spans via custom JavaScript - a button click manually emits a span using the emitSpan() function.

### Step 2: **User Interaction Instrumentation**
- Uncomment only the `@opentelemetry/instrumentation-user-interaction` registration.
- Try clicking and typing—spans will be generated automatically for these actions.

### Step 3: **Full Web Instrumentation**
- TODO
- TODO

### Final Step: **Weather API Tracing (Hybrid Example)**
- The weather fetch shows hybrid tracing:
  - Automatic fetch instrumentation
  - Manual span enrichment and nesting for fine-grained control

All spans should be visible in Elastic Observability UI under the `vanilla-frontend` servicename.



## License
[Apache 2.0](LICENSE)


Feel free to fork, explore, and extend!

