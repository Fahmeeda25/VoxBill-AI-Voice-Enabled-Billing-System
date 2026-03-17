import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

function App() {
  const [product, setProduct] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const savedHistory =
      JSON.parse(localStorage.getItem("billHistory")) || [];
    setHistory(savedHistory);
  }, []);

  // 🎤 Voice
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();
      const words = text.split(" ");

      const numbers = words.filter((w) => !isNaN(w));
      const name = words.filter((w) => isNaN(w)).join(" ");

      setProduct(name);
      if (numbers.length >= 1) setPrice(numbers[0]);
      if (numbers.length >= 2) setQuantity(numbers[1]);
    };

    recognition.onend = () => setIsListening(false);
  };

  // ➕ Add Item
  const addItem = () => {
    const p = parseFloat(price);
    const q = parseFloat(quantity);

    if (!product || isNaN(p) || isNaN(q)) {
      alert("Enter valid details");
      return;
    }

    const total = p * q;
    setItems([...items, { product, price: p, quantity: q, total }]);

    setProduct("");
    setPrice("");
    setQuantity("");
  };

  // ❌ Delete
  const deleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // 🧹 Clear
  const clearAll = () => {
    setItems([]);
  };

  // 📄 PDF + History
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("VOICE BILLING SYSTEM", 60, 15);

    const tableColumn = ["Product", "Price", "Quantity", "Total"];
    const tableRows = items.map((item) => [
      item.product,
      item.price,
      item.quantity,
      item.total,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: "grid",
    });

    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.text(`Grand Total: ₹${grandTotal}`, 14, finalY);
    doc.save("bill.pdf");

    // Save History
    const newBill = {
      date: new Date().toLocaleString(),
      items,
      grandTotal,
    };

    const updatedHistory = [...history, newBill];
    setHistory(updatedHistory);
    localStorage.setItem("billHistory", JSON.stringify(updatedHistory));
  };

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="container">
      <h1>🧾 Voice Billing System</h1>

      <button
        onClick={startListening}
        className="voiceBtn"
      >
        🎤 {isListening ? "Listening..." : "Speak Details"}
      </button>

      <div className="inputContainer">
        <input
          placeholder="Product"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />

        <input
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          placeholder="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <button onClick={addItem} className="addBtn">
        ➕ Add Item
      </button>

      <h2>Bill Table</h2>

      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{item.product}</td>
              <td>{item.price}</td>
              <td>{item.quantity}</td>
              <td>{item.total}</td>
              <td>
                <button
                  onClick={() => deleteItem(index)}
                  className="deleteBtn"
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="grandTotal">
        Grand Total: ₹{grandTotal}
      </h2>

      <button
        onClick={generatePDF}
        disabled={items.length === 0}
        className="pdfBtn"
      >
        📄 Download PDF
      </button>

      <button
        onClick={clearAll}
        disabled={items.length === 0}
        className="clearBtn"
      >
        🧹 Clear All
      </button>

      <h2>📂 Bill History</h2>

      {history.length === 0 ? (
        <p>No previous bills</p>
      ) : (
        history.map((bill, index) => (
          <div key={index} className="historyCard">
            <p><strong>Date:</strong> {bill.date}</p>
            <p><strong>Total:</strong> ₹{bill.grandTotal}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default App;
