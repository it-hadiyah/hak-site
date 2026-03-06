function $(selector) {
  return document.querySelector(selector);
}

function loadJson(url) {
  return fetch(url).then((res) => res.json());
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}
const titleEl = document.querySelector("#news-title");
const dateEl = document.querySelector("#news-date");
const textEl = document.querySelector("#news-text");
const imageEl = document.querySelector("#news-image"); // أضفنا هذا السطر

const params = new URLSearchParams(window.location.search);
const newsId = params.get("id");

loadJson("data/news.json")
  .then((items) => {
    const news = items.find(n => n.id == newsId);
    if (!news) {
      textEl.innerText = "الخبر غير موجود";
      return;
    }
    
    // تحديث البيانات دايناميكياً من الـ JSON
    titleEl.innerText = news.title;
    dateEl.innerText = news.date;
    textEl.innerText = news.content;
    imageEl.src = news.image; // تحديث الصورة دايناميكياً
    imageEl.alt = news.title;
  })
  .catch(err => {
    console.error(err);
    textEl.innerText = "خطأ في تحميل الخبر";
  });
