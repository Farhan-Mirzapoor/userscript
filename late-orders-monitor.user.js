// ==UserScript==
// @name         Late Orders Monitor (Production Ready)
// @namespace    https://weeorder.co.uk/
// @version      5.5
// @description  Monitor orders, notify with icons when new orders are added or printed. Removes highlighting.
// @author       You
// @match        https://unprintorders.weeorder.co.uk/PreOrders/LateOrders
// @grant        GM_addStyle
// @updateURL    https://cdn.jsdelivr.net/gh/Farhan‑Mirzapoor/userscript@main/late-orders-monitor.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/Farhan‑Mirzapoor/userscript@main/late-orders-monitor.user.js
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 1000;
  const REFRESH_INTERVAL_MS = 20000;
  const NOTIFICATION_ICON = "https://unprintorders.weeorder.co.uk/favicon.ico";

  // New Order Icon (Base64)
  const NEW_ORDER_ICON =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXJlY2VpcHQtdGV4dC1pY29uIGx1Y2lkZS1yZWNlaXB0LXRleHQiPjxwYXRoIGQ9Ik00IDJ2MjBsMi0xIDIgMSAyLTEgMiAxIDItMSAyIDEgMi0xIDIgMVYybC0yIDEtMi0xLTIgMS0yLTEtMiAxLTItMS0yIDFaIi8+PHBhdGggZD0iTTE0IDhIOCIvPjxwYXRoIGQ9Ik0xNiAxMkg4Ii8+PHBhdGggZD0iTTEzIDE2SDgiLz48L3N2Zz4=";

  // Printed Order Icon (Base64)
  const PRINTED_ORDER_ICON =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZsYW1lLWljb24gbHVjaWRlLWZsYW1lIj48cGF0aCBkPSJNMTIgM3ExIDQgNCA2LjV0MyA1LjVhMSAxIDAgMCAxLTE0IDAgNSA1IDAgMCAxIDEtMyAxIDEgMCAwIDAgNSAwYzAtMi0xLjUtMy0xLjUtNXEwLTIgMi41LTQiLz48L3N2Zz4=";

  const STORAGE_KEY_IDS = "late_orders_monitor_ids";
  const STORAGE_KEY_DETAILS = "late_orders_monitor_details";
  const STORAGE_KEY_INITIALIZED = "late_orders_monitor_initialized";

  // Injecting custom CSS to simulate dark mode with beautiful buttons and white text
  // ==UserScript==
  // @name         Late Orders Monitor (Production Ready)
  // @namespace    https://weeorder.co.uk/
  // @version      3.5
  // @description  Monitor orders, notify with icons when new orders are added or printed. Removes highlighting.
  // @author       You
  // @match        https://unprintorders.weeorder.co.uk/PreOrders/LateOrders
  // @grant        GM_addStyle
  // @updateURL    https://cdn.jsdelivr.net/gh/Farhan‑Mirzapoor/userscript@main/late-orders-monitor.user.js
  // @downloadURL  https://cdn.jsdelivr.net/gh/Farhan‑Mirzapoor/userscript@main/late-orders-monitor.user.js
  // ==/UserScript==

  (function () {
    "use strict";

    const CHECK_INTERVAL_MS = 1000;
    const REFRESH_INTERVAL_MS = 20000;
    const NOTIFICATION_ICON =
      "https://unprintorders.weeorder.co.uk/favicon.ico";

    // New Order Icon (Base64)
    const NEW_ORDER_ICON =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXJlY2VpcHQtdGV4dC1pY29uIGx1Y2lkZS1yZWNlaXB0LXRleHQiPjxwYXRoIGQ9Ik00IDJ2MjBsMi0xIDIgMSAyLTEgMiAxIDItMSAyIDEgMi0xIDIgMVYybC0yIDEtMi0xLTIgMS0yLTEtMiAxLTItMS0yIDFaIi8+PHBhdGggZD0iTTE0IDhIOCIvPjxwYXRoIGQ9Ik0xNiAxMkg4Ii8+PHBhdGggZD0iTTEzIDE2SDgiLz48L3N2Zz4=";

    // Printed Order Icon (Base64)
    const PRINTED_ORDER_ICON =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZsYW1lLWljb24gbHVjaWRlLWZsYW1lIj48cGF0aCBkPSJNMTIgM3ExIDQgNCA2LjV0MyA1LjVhMSAxIDAgMCAxLTE0IDAgNSA1IDAgMCAxIDEtMyAxIDEgMCAwIDAgNSAwYzAtMi0xLjUtMy0xLjUtNXEwLTIgMi41LTQiLz48L3N2Zz4=";

    const STORAGE_KEY_IDS = "late_orders_monitor_ids";
    const STORAGE_KEY_DETAILS = "late_orders_monitor_details";
    const STORAGE_KEY_INITIALIZED = "late_orders_monitor_initialized";

    GM_addStyle(`
/* Global Styles */
body, .container, .orders, header, .section {
    background-color: #111111 !important;
    color: #ffffff !important; /* Force all text to be white */
    font-family: "Inter", sans-serif !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
    font-weight: normal !important; /* Default weight is normal for most text */
}

/* Ensure all text is white inside elements */
* {
    color: #ffffff !important; /* Force white text everywhere */
    font-weight: normal !important; /* Default weight for all elements */
}

/* Remove Borders Everywhere */
* {
    border: none !important;
}

/* Links and buttons */
a, button {
    color: #61dafb !important;
    text-decoration: none !important;
    cursor: pointer !important;
    font-weight: normal !important; /* Ensure links and buttons are not bold */
}

/* Header and important sections */
header, .section, .container, .orders {
    background-color: #1a1a1a !important;
    padding: 15px !important;
    border-radius: 8px !important;
    color: #ffffff !important; /* Ensure text is white inside these sections */
    font-weight: normal !important; /* Default weight for regular content */
}

/* Order Entry */
.order-entry {
    background-color: #222222 !important;
    border-radius: 8px !important;
    margin-bottom: 10px !important;
    padding: 12px !important;
    color: #ffffff !important; /* Ensure text inside order entry is white */
    font-weight: normal !important; /* Order details should not be bold */
    border: 2px solid #61dafb !important; /* Add a border with a color (e.g., blue) */
}

/* Optional: Add hover effect to highlight when the card is hovered */
.order-entry:hover {
    border-color: #00ff00 !important; /* Green color on hover */
}

/* Notification style for added or removed orders */
.notification {
    background-color: #444444 !important;
    border-radius: 5px !important;
    padding: 8px !important;
    margin-bottom: 10px !important;
    color: #ffffff !important; /* Ensure text inside notifications is white */
    font-weight: normal !important; /* Regular weight for notification content */
}

.notification .order-id {
    color: #61dafb !important;
    font-weight: bold !important; /* Make order IDs bold for emphasis */
}

/* Enhance Button Styling */
button {
    background-color: #333333 !important;
    color: #ffffff !important; /* Ensure buttons have white text */
    font-size: 14px !important;
    padding: 10px 15px !important;
    border-radius: 5px !important;
    border: none !important;
    transition: background-color 0.3s ease !important, transform 0.2s ease !important;
    font-weight: normal !important; /* Ensure buttons are not bold */
}

button:hover {
    background-color: #444444 !important;
    transform: translateY(-2px) !important;
}

button:active {
    background-color: #555555 !important;
    transform: translateY(0) !important;
}

/* Custom scrollbars for dark mode */
::-webkit-scrollbar {
    width: 8px !important;
}

::-webkit-scrollbar-thumb {
    background-color: #555555 !important;
    border-radius: 5px !important;
}

::-webkit-scrollbar-track {
    background-color: #333333 !important;
}

/* Hierarchical Text Styling: */
h1, h2, h3, h4, h5, h6 {
    font-weight: bold !important; /* Headers should be bold */
    color: #ffffff !important; /* Ensure headers are also white */
}

/* Specific adjustments for smaller text elements */
.order-entry div {
    font-size: 13px !important; /* Smaller font for order details */
}

/* Styling for added orders, customer details, etc. */
.order-id {
    font-weight: bold !important; /* Order IDs should be bold */
    font-size: 16px !important; /* Slightly larger for emphasis */
}

.order-details {
    font-size: 14px !important; /* Standard font size for order details */
    font-weight: normal !important; /* Regular weight for content */
}
`);

    // Function to send notifications (unchanged)
    function sendNotification(title, message, icon) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body: message,
          icon: icon,
        });
      }
    }

    function getOrderElements() {
      return Array.from(document.querySelectorAll("#result .orders"));
    }

    function extractOrderDetails(orderEl) {
      const shopEl = orderEl.closest(".shop");
      const shop = shopEl
        ? shopEl.querySelector("div:first-child")?.textContent.trim()
        : "Unknown Shop";
      const customer =
        orderEl.querySelector("div:nth-child(2)")?.textContent.trim() ||
        "Unknown Customer";
      const delivery =
        orderEl.querySelector("div:nth-child(3)")?.textContent.trim() ||
        "Unknown Delivery";
      const idRaw =
        orderEl.querySelector("div:nth-child(1) span")?.textContent ||
        "Unknown ID";
      const id = idRaw.trim();

      // Extract and parse the order date
      const orderDateStr =
        orderEl.querySelector("div:nth-child(4) span")?.textContent.trim() ||
        "Unknown Date";
      const orderDate = new Date(orderDateStr);

      // Extract and parse the delivery date
      const deliveryDateStr =
        orderEl.querySelector("div:nth-child(5) span")?.textContent.trim() ||
        "Unknown Delivery Date";
      const deliveryDate = new Date(deliveryDateStr);

      // If the date is invalid, use the current date and time
      const formattedOrderDate = isNaN(orderDate) ? new Date() : orderDate;
      const formattedDeliveryDate = isNaN(deliveryDate)
        ? new Date()
        : deliveryDate;

      return {
        id,
        shop,
        customer,
        delivery,
        formattedOrderDate,
        formattedDeliveryDate,
      };
    }

    function loadStoredIds() {
      try {
        const data = localStorage.getItem(STORAGE_KEY_IDS);
        return data ? JSON.parse(data).map((id) => id.trim()) : [];
      } catch {
        return [];
      }
    }

    function saveStoredIds(ids) {
      const normalized = ids.map((id) => id.trim());
      localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(normalized));
    }

    function loadStoredDetails() {
      try {
        const data = localStorage.getItem(STORAGE_KEY_DETAILS);
        return data ? JSON.parse(data) : {};
      } catch {
        return {};
      }
    }

    function saveStoredDetails(details) {
      localStorage.setItem(STORAGE_KEY_DETAILS, JSON.stringify(details));
    }

    function logDiffs(prev, curr) {
      const added = curr.filter((id) => !prev.includes(id));
      const removed = prev.filter((id) => !curr.includes(id));
      console.group("Late Orders Monitor - Differences");
      console.log("Previous IDs:", prev);
      console.log("Current IDs:", curr);
      console.log("Added IDs:", added);
      console.log("Removed IDs:", removed);
      console.groupEnd();
    }

    if (
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission();
    }

    let previousOrderIds = loadStoredIds();
    let previousOrderDetails = loadStoredDetails();
    let isFirstCheck = !localStorage.getItem(STORAGE_KEY_INITIALIZED);

    function checkOrders() {
      const orderEls = getOrderElements();
      const currentOrderDetails = {};
      const currentOrderIds = [];

      orderEls.forEach((orderEl) => {
        const { id, shop, customer, delivery, formattedOrderDate } =
          extractOrderDetails(orderEl);
        currentOrderIds.push(id);
        currentOrderDetails[id] = {
          shop,
          customer,
          delivery,
          formattedOrderDate,
        };
      });

      logDiffs(previousOrderIds, currentOrderIds);

      if (isFirstCheck) {
        localStorage.setItem(STORAGE_KEY_INITIALIZED, "true");
        previousOrderIds = currentOrderIds;
        previousOrderDetails = currentOrderDetails;
        saveStoredIds(previousOrderIds);
        saveStoredDetails(previousOrderDetails);
        console.log(
          "Initial load: saved current orders, skipping notifications.",
        );
        isFirstCheck = false;
        return;
      }

      const addedOrders = currentOrderIds.filter(
        (id) => !previousOrderIds.includes(id),
      );
      const removedOrders = previousOrderIds.filter(
        (id) => !currentOrderIds.includes(id),
      );

      if (addedOrders.length > 0) {
        addedOrders.forEach((id) => {
          const { shop, customer, delivery, formattedOrderDate } =
            currentOrderDetails[id] || {};
          const formattedDate = formattedOrderDate.toLocaleString();
          sendNotification(
            `New Unprint: ${shop}`,
            `Customer: ${customer}\nDelivery: ${delivery}\nOrder ID: ${id}\nOrder Date: ${formattedDate}`,
            NEW_ORDER_ICON, // New order icon
          );
        });
      }

      if (removedOrders.length > 0) {
        removedOrders.forEach((id) => {
          const details = previousOrderDetails[id] || {};
          const shop = details.shop || "Unknown Shop";
          const customer = details.customer || "Unknown Customer";
          const delivery = details.delivery || "Unknown Delivery";
          const { formattedDeliveryDate } = details;
          const formattedDeliveryDateStr =
            formattedDeliveryDate.toLocaleString();
          sendNotification(
            `Order Printed: ${shop}`,
            `Customer: ${customer}\nDelivery: ${delivery}\nOrder ID: ${id}\nDelivery Date: ${formattedDeliveryDateStr}`,
            PRINTED_ORDER_ICON, // Printed order icon
          );
        });
      }

      previousOrderIds = currentOrderIds;
      previousOrderDetails = currentOrderDetails;
      saveStoredIds(previousOrderIds);
      saveStoredDetails(previousOrderDetails);
    }

    setInterval(() => {
      checkOrders();
    }, CHECK_INTERVAL_MS);

    setInterval(() => {
      window.location.reload();
    }, REFRESH_INTERVAL_MS);
  })();

  // Function to send notifications (unchanged)
  function sendNotification(title, message, icon) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: icon,
      });
    }
  }

  function getOrderElements() {
    return Array.from(document.querySelectorAll("#result .orders"));
  }

  function extractOrderDetails(orderEl) {
    const shopEl = orderEl.closest(".shop");
    const shop = shopEl
      ? shopEl.querySelector("div:first-child")?.textContent.trim()
      : "Unknown Shop";
    const customer =
      orderEl.querySelector("div:nth-child(2)")?.textContent.trim() ||
      "Unknown Customer";
    const delivery =
      orderEl.querySelector("div:nth-child(3)")?.textContent.trim() ||
      "Unknown Delivery";
    const idRaw =
      orderEl.querySelector("div:nth-child(1) span")?.textContent ||
      "Unknown ID";
    const id = idRaw.trim();

    // Extract and parse the order date
    const orderDateStr =
      orderEl.querySelector("div:nth-child(4) span")?.textContent.trim() ||
      "Unknown Date";
    const orderDate = new Date(orderDateStr);

    // If the date is invalid, use the current date and time
    const formattedOrderDate = isNaN(orderDate) ? new Date() : orderDate;

    return { id, shop, customer, delivery, formattedOrderDate };
  }

  function loadStoredIds() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_IDS);
      return data ? JSON.parse(data).map((id) => id.trim()) : [];
    } catch {
      return [];
    }
  }

  function saveStoredIds(ids) {
    const normalized = ids.map((id) => id.trim());
    localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(normalized));
  }

  function loadStoredDetails() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DETAILS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  function saveStoredDetails(details) {
    localStorage.setItem(STORAGE_KEY_DETAILS, JSON.stringify(details));
  }

  function logDiffs(prev, curr) {
    const added = curr.filter((id) => !prev.includes(id));
    const removed = prev.filter((id) => !curr.includes(id));
    console.group("Late Orders Monitor - Differences");
    console.log("Previous IDs:", prev);
    console.log("Current IDs:", curr);
    console.log("Added IDs:", added);
    console.log("Removed IDs:", removed);
    console.groupEnd();
  }

  if (
    Notification.permission !== "granted" &&
    Notification.permission !== "denied"
  ) {
    Notification.requestPermission();
  }

  let previousOrderIds = loadStoredIds();
  let previousOrderDetails = loadStoredDetails();
  let isFirstCheck = !localStorage.getItem(STORAGE_KEY_INITIALIZED);

  function checkOrders() {
    const orderEls = getOrderElements();
    const currentOrderDetails = {};
    const currentOrderIds = [];

    orderEls.forEach((orderEl) => {
      const { id, shop, customer, delivery, formattedOrderDate } =
        extractOrderDetails(orderEl);
      currentOrderIds.push(id);
      currentOrderDetails[id] = {
        shop,
        customer,
        delivery,
        formattedOrderDate,
      };
    });

    logDiffs(previousOrderIds, currentOrderIds);

    if (isFirstCheck) {
      localStorage.setItem(STORAGE_KEY_INITIALIZED, "true");
      previousOrderIds = currentOrderIds;
      previousOrderDetails = currentOrderDetails;
      saveStoredIds(previousOrderIds);
      saveStoredDetails(previousOrderDetails);
      console.log(
        "Initial load: saved current orders, skipping notifications.",
      );
      isFirstCheck = false;
      return;
    }

    const addedOrders = currentOrderIds.filter(
      (id) => !previousOrderIds.includes(id),
    );
    const removedOrders = previousOrderIds.filter(
      (id) => !currentOrderIds.includes(id),
    );

    if (addedOrders.length > 0) {
      addedOrders.forEach((id) => {
        const { shop, customer, delivery, formattedOrderDate } =
          currentOrderDetails[id] || {};
        const formattedDate = formattedOrderDate.toLocaleString();
        sendNotification(
          `New Unprint: ${shop}`,
          `Customer: ${customer}\nDelivery: ${delivery}\nOrder ID: ${id}\nOrder Date: ${formattedDate}`,
          NEW_ORDER_ICON, // New order icon
        );
      });
    }

    if (removedOrders.length > 0) {
      removedOrders.forEach((id) => {
        const details = previousOrderDetails[id] || {};
        const shop = details.shop || "Unknown Shop";
        const customer = details.customer || "Unknown Customer";
        const delivery = details.delivery || "Unknown Delivery";
        const { formattedOrderDate } = details;
        const formattedDate = formattedOrderDate.toLocaleString();
        sendNotification(
          `Order Printed: ${shop}`,
          `Customer: ${customer}\nDelivery: ${delivery}\nOrder ID: ${id}\nOrder Date: ${formattedDate}`,
          PRINTED_ORDER_ICON, // Printed order icon
        );
      });
    }

    previousOrderIds = currentOrderIds;
    previousOrderDetails = currentOrderDetails;
    saveStoredIds(previousOrderIds);
    saveStoredDetails(previousOrderDetails);
  }

  setInterval(() => {
    checkOrders();
  }, CHECK_INTERVAL_MS);

  setInterval(() => {
    window.location.reload();
  }, REFRESH_INTERVAL_MS);
})();
