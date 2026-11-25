let materials = [];
let quizzes = [];
let currentType = "book";
let deferredPrompt = null;

const titles = {
  book: "Thư viện sách",
  lesson: "Thư viện giáo án",
  reference: "Tài liệu tham khảo"
};

async function loadData() {
  const [mRes, qRes] = await Promise.all([
    fetch("data/materials.json"),
    fetch("data/quizzes.json")
  ]);
  materials = await mRes.json();
  quizzes = await qRes.json();
  renderQuiz();
}

function openTab(tab) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

  if (["book", "lesson", "reference"].includes(tab)) {
    currentType = tab;
    document.getElementById("materialsTitle").textContent = titles[tab];
    document.getElementById("tab-materials").classList.add("active");
    renderMaterials();
  } else {
    document.getElementById("tab-" + tab).classList.add("active");
  }
}

function renderMaterials() {
  const kw = document.getElementById("searchInput").value.trim().toLowerCase();
  const box = document.getElementById("materialsList");
  const list = materials.filter(x =>
    x.type === currentType &&
    (x.title.toLowerCase().includes(kw) || x.category.toLowerCase().includes(kw) || x.description.toLowerCase().includes(kw))
  );

  box.innerHTML = list.length ? list.map(item => `
    <div class="doc-card">
      <span class="badge">${item.category}</span>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <a class="btn btn-primary" href="${item.url}" target="_blank" rel="noopener">Mở tài liệu</a>
    </div>
  `).join("") : `<div class="card"><p>Không có dữ liệu phù hợp.</p></div>`;
}

function renderQuiz() {
  const quiz = quizzes[0];
  const container = document.getElementById("quizContainer");
  const btn = document.getElementById("submitQuizBtn");
  if (!quiz) return;

  container.innerHTML = `<h3>${quiz.title}</h3>` + quiz.questions.map((q, i) => `
    <div class="q-box">
      <p><strong>Câu ${i + 1}:</strong> ${q.question}</p>
      ${q.options.map((op, j) => `
        <label class="opt"><input type="radio" name="q${i}" value="${j}" /> ${op}</label>
      `).join("")}
    </div>
  `).join("");

  btn.style.display = "inline-block";
  btn.onclick = () => {
    let score = 0;
    const html = quiz.questions.map((q, i) => {
      const picked = document.querySelector(`input[name="q${i}"]:checked`);
      const ok = picked && Number(picked.value) === q.answer;
      if (ok) score++;
      return `<p style="margin-top:8px;"><strong>Câu ${i + 1}:</strong> ${ok ? "Đúng" : "Chưa đúng"} – ${q.explanation}</p>`;
    }).join("");
    document.getElementById("quizResult").innerHTML = `<h3 style="margin-top:14px;">Điểm: ${score}/${quiz.questions.length}</h3>${html}`;
  };
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => openTab(btn.dataset.tab));
});
document.getElementById("searchInput").addEventListener("input", renderMaterials);

document.getElementById("chatForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const box = document.getElementById("chatBox");
  const text = input.value.trim();
  if (!text) return;

  box.innerHTML += `<div class="msg user">${text}</div>`;
  input.value = "";
  const replyEl = document.createElement("div");
  replyEl.className = "msg bot";
  replyEl.textContent = "Đang xử lý...";
  box.appendChild(replyEl);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    replyEl.textContent = data.reply || "Chưa có phản hồi.";
  } catch {
    replyEl.textContent = "Phần Chatbot sẽ trả lời thật sau khi bạn gắn hàm /api/chat khi đưa web lên mạng.";
  }
  box.scrollTop = box.scrollHeight;
});

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
});
document.getElementById("installBtn").addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt = null;
  } else {
    document.getElementById("iosModal").classList.remove("hidden");
  }
});
document.getElementById("closeIosModal").addEventListener("click", () => {
  document.getElementById("iosModal").classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}

loadData();