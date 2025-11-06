// Context and trace are used to manage the current context and create spans
import { context, trace } from '@opentelemetry/api';
// Import telemetry initilization function
import { initTelemetry } from './telemetry.js';

initTelemetry();

const tracer = trace.getTracer('vanilla-frontend');
const weatherApiKey = "3af404b5e7b34adcb45202556251704";

// Logging utility for UI
const logToUI = (spanName, spanContext, type = 'manual', details = {}) => {
  const logOutput = document.querySelector('#logOutput');
  const timestamp = new Date().toISOString();
  const traceId = spanContext?.traceId || 'N/A';
  const spanId = spanContext?.spanId || 'N/A';

  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;

  let detailsHTML = '';
  for (const [key, value] of Object.entries(details)) {
    detailsHTML += `<div class="log-detail"><span>${key}:</span> ${value}</div>`;
  }

  logEntry.innerHTML = `
    <div class="log-time">${timestamp}</div>
    <span class="log-type ${type}">${type}</span>
    <div class="log-detail"><span>Span:</span> ${spanName}</div>
    <div class="log-detail"><span>Trace ID:</span> <span class="log-trace-id">${traceId}</span></div>
    <div class="log-detail"><span>Span ID:</span> <span class="log-span-id">${spanId}</span></div>
    ${detailsHTML}
  `;

  // Insert at the top
  logOutput.insertBefore(logEntry, logOutput.firstChild);

  // Auto-scroll to top
  logOutput.scrollTop = 0;
};

// Clear logs button and initialize log
document.addEventListener('DOMContentLoaded', () => {
  const logOutput = document.querySelector('#logOutput');

  // Add initial message
  logOutput.innerHTML = `
    <div class="log-entry" style="border-left-color: #4fc3f7;">
      <div class="log-time">${new Date().toISOString()}</div>
      <span class="log-type" style="background: #4fc3f7;">READY</span>
      <div class="log-detail"><span>Status:</span> Telemetry logging initialized</div>
      <div class="log-detail"><span>Info:</span> Interact with the buttons above to see trace data appear here</div>
    </div>
  `;

  document.querySelector('#clearLogs')?.addEventListener('click', () => {
    logOutput.innerHTML = '';
  });
});


const getDataCascade = () => {
  // Log the cascade start
  const activeSpan = trace.getSpan(context.active());
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    logToUI('API Cascade Started', spanContext, 'fetch', {
      'Requests': '3 cascading requests',
      'Endpoint': 'jsonplaceholder.typicode.com',
      'Type': 'XMLHttpRequest + Fetch'
    });
  }

  getData1('https://jsonplaceholder.typicode.com/posts/1').then(() => {
    getData2('https://jsonplaceholder.typicode.com/users/1').then(() => {
      console.log('data downloaded 2');
    });
    getData1('https://jsonplaceholder.typicode.com/todos/1').then(() => {
      console.log('data downloaded 3');
    });
    console.log('data downloaded 1');
  });
}

// Example using XMLHttpRequest instead of fetch
const getData1 = (url) => {
  return new Promise(async (resolve) => {
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.setRequestHeader('Accept', 'application/json');
    req.send();
    req.onload = function () {
      resolve();
    };
  });
}

const getData2 = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error in getData:', error);
  }
}

// Manual span emitter tool for debugging
const emitSpan = (action, value) => {
  const parent = trace.getSpan(context.active());
  const span = tracer.startSpan(action, {
    parent: parent?.spanContext(), // this helps propagate parent trace
  });

  // Run the span within the active context
  context.with(trace.setSpan(context.active(), span), () => {
    span.setAttribute('action', action);
    if (value !== undefined) {
      span.setAttribute('value', value);
    }
    console.log(`Manual span '${action}' emitted`);

    // Log to UI
    const spanContext = span.spanContext();
    logToUI(action, spanContext, 'manual', {
      'Action': action,
      'Value': value || 'N/A',
      'Status': 'Batched (sent every 1s)'
    });

    subFunction(action);
    span.end();
  });
};

const subFunction = (action) => {
  const tracer = trace.getTracer('vanilla-frontend');
  const span = tracer.startSpan(`${action}.subfunction.emitSpan`);

  // Optional: run in context if you have async work
  context.with(trace.setSpan(context.active(), span), () => {
    span.setAttribute('sub.key', 'subvalue');
    span.setAttribute('result', 1);

    // Log to UI
    const spanContext = span.spanContext();
    logToUI(`${action}.subfunction`, spanContext, 'manual', {
      'Parent Action': action,
      'Result': '1',
      'Type': 'Child span'
    });

    span.end();
  });
  // this return value will show up in the span as a result numeric_label type
  return 1;
}

const renderWeather = (data) => {
  const weatherContainer = document.querySelector('#weather');

  const { location, current } = data;
  const { name, region, country }  = location;
  const { temp_f, condition } = current;

  weatherContainer.innerHTML = `
    <h2>${name}, ${region}, ${country}</h2>
    <p>Temperature: ${temp_f}°F</p>
    <p>Conditions: ${condition.text}</p>`

  weatherContainer.style.display = 'block';

  return weatherContainer;
}

const getWeather = async (input) => {
  let weatherEndpoint = `http://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${input || 98366}&aqi=yes`;
  try {
      // Log the fetch start
      const activeSpan = trace.getSpan(context.active());
      if (activeSpan) {
        const spanContext = activeSpan.spanContext();
        logToUI('Weather API Fetch', spanContext, 'fetch', {
          'URL': weatherEndpoint.split('?')[0],
          'City': input || '98366',
          'Method': 'GET'
        });
      }

      const response = await fetch(weatherEndpoint);
      const cloneForApp = response.clone();
      const data = await cloneForApp.json();
      renderWeather(data);

      return response;
    } catch (e) {
      console.error('Error fetching weather data:', e);
    }
  }
  
document.querySelector('#getWeather').addEventListener('click', () => {
  const input = document.querySelector('#weatherInput').value;
  getWeather(input)
});

document.querySelector('#button1').addEventListener('click', () => {
  emitSpan('user.clicked.#button1', '#button1');
});

// Track slider interaction with start and end values
let sliderTimeout;
let sliderStartValue = null;

// Capture initial value when interaction starts
document.querySelector('#slider').addEventListener('mousedown', (e) => {
  sliderStartValue = e.target.value;
});

document.querySelector('#slider').addEventListener('touchstart', (e) => {
  sliderStartValue = e.target.value;
});

// Create span with rich attributes when interaction completes
document.querySelector('#slider').addEventListener('change', (e) => {
  const endValue = parseInt(e.target.value);
  const startValue = parseInt(sliderStartValue || endValue);
  const delta = endValue - startValue;
  const direction = delta > 0 ? 'increased' : delta < 0 ? 'decreased' : 'unchanged';

  // Create a span with the slider as the action name
  const span = tracer.startSpan('user.adjusted.slider');

  context.with(trace.setSpan(context.active(), span), () => {
    span.setAttribute('slider.start.value', startValue);
    span.setAttribute('slider.end.value', endValue);
    span.setAttribute('slider.delta', delta);
    span.setAttribute('slider.direction', direction);
    span.setAttribute('slider.magnitude', Math.abs(delta));

    // Add context about the adjustment
    let adjustmentType;
    if (Math.abs(delta) >= 5) {
      adjustmentType = 'large';
      span.setAttribute('slider.adjustment', 'large');
    } else if (Math.abs(delta) >= 2) {
      adjustmentType = 'medium';
      span.setAttribute('slider.adjustment', 'medium');
    } else if (delta !== 0) {
      adjustmentType = 'small';
      span.setAttribute('slider.adjustment', 'small');
    } else {
      adjustmentType = 'none';
      span.setAttribute('slider.adjustment', 'none');
    }

    console.log(`Slider adjusted from ${startValue} to ${endValue} (${direction} by ${Math.abs(delta)})`);

    // Log to UI
    const spanContext = span.spanContext();
    logToUI('user.adjusted.slider', spanContext, 'interaction', {
      'Start': startValue,
      'End': endValue,
      'Delta': delta > 0 ? `+${delta}` : delta,
      'Direction': direction,
      'Adjustment': adjustmentType
    });

    span.end();
  });

  // Reset for next interaction
  sliderStartValue = endValue;
});

// Visual feedback only (no span creation) for input events
document.querySelector('#slider').addEventListener('input', (e) => {
  const value = e.target.value;
  clearTimeout(sliderTimeout);

  // Only log to UI, don't create spans (prevents queue overflow)
  sliderTimeout = setTimeout(() => {
    const startVal = sliderStartValue || value;
    const delta = parseInt(value) - parseInt(startVal);
    logToUI('Slider Dragging', { traceId: 'UI-ONLY', spanId: 'NO-SPAN' }, 'interaction', {
      'Current Value': value,
      'Start Value': startVal,
      'Delta': delta !== 0 ? (delta > 0 ? `+${delta}` : delta) : '0',
      'Note': 'Span created on release'
    });
  }, 300); // Debounce by 300ms
});

document.querySelector('#button2').addEventListener('click', () => {
  getDataCascade()
});
