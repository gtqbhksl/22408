// Exam Bank Controller - 分页版
(function() {
  let currentYear = '2025';
  let currentType = 'all';
  let currentPage = 1;
  let currentItems = [];
  const PAGE_SIZE = 20;

  function initExamBank() {
    const years = [...new Set(EXAM_DATA.map(q => q[0]))].sort().reverse();
    const yearScroll = document.getElementById('yearScroll');
    if (!yearScroll) return;

    let html = '';
    for (const y of years) {
      html += `<button class="year-btn${y === currentYear ? ' active' : ''}" onclick="filterExamYear('${y}')">${y}</button>`;
    }
    yearScroll.innerHTML = html;

    renderExamQuestions();
  }

  function filterExamYear(year) {
    currentYear = year;
    currentPage = 1;
    document.querySelectorAll('.year-btn').forEach(b => {
      b.classList.toggle('active', b.textContent === year);
    });
    renderExamQuestions();
  }

  function filterExamType(type) {
    currentType = type;
    currentPage = 1;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderExamQuestions();
  }

  function getFiltered() {
    let filtered = EXAM_DATA;
    if (currentYear !== 'all') {
      filtered = filtered.filter(q => q[0] === currentYear);
    }
    if (currentType !== 'all') {
      filtered = filtered.filter(q => q[1] === currentType);
    }
    return filtered;
  }

  function renderExamQuestions() {
    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = filtered.slice(start, end);
    currentItems = pageItems;

    // Stats
    const stats = document.getElementById('examStats');
    const typeCounts = {};
    filtered.forEach(q => { typeCounts[q[1]] = (typeCounts[q[1]] || 0) + 1; });
    let statsHtml = `共 <span>${filtered.length}</span> 题`;
    if (typeCounts['选择题']) statsHtml += ` · 选择<span>${typeCounts['选择题']}</span>`;
    if (typeCounts['填空题']) statsHtml += ` · 填空<span>${typeCounts['填空题']}</span>`;
    if (typeCounts['解答题']) statsHtml += ` · 解答<span>${typeCounts['解答题']}</span>`;
    if (totalPages > 1) statsHtml += ` · 第 <span>${currentPage}/${totalPages}</span> 页`;
    stats.innerHTML = statsHtml;

    const container = document.getElementById('examQuestions');
    if (filtered.length === 0) {
      container.innerHTML = '<div class="no-results">&#128269; 没有找到匹配的题目</div>';
      return;
    }

    let html = '';
    for (let i = 0; i < pageItems.length; i++) {
      const [year, type, num, question, answer, solution] = pageItems[i];
      html += `<div class="q-card">
        <div class="q-header">
          <div class="q-meta">
            <span class="q-year">${year}年</span>
            <span class="q-type ${type}">${type}</span>
            <span class="q-number">第${num}题</span>
          </div>
          <div class="q-actions">
            <button class="q-copy" title="复制题干与选项（保留 LaTeX 源码）" onclick="copyExamQuestion(this, ${i})">复制题目</button>
            <button class="q-toggle" onclick="toggleExamAnswer(this)">查看解答</button>
          </div>
        </div>
        <div class="q-text">${question}</div>
        <div class="q-hidden">
          ${answer ? `<div class="q-answer-box"><div class="q-answer-label">&#9989; 答案</div><div>${answer}</div></div>` : ''}
          ${solution ? `<div class="q-solution"><div class="q-answer-label">&#128161; 解析</div><div>${solution}</div></div>` : ''}
        </div>
      </div>`;
    }

    // Pagination controls
    if (totalPages > 1) {
      html += `<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap">`;
      if (currentPage > 1) {
        html += `<button class="year-btn" onclick="examPage(${currentPage - 1})">← 上一页</button>`;
      }
      // Show max 7 page buttons
      let startPage = Math.max(1, currentPage - 3);
      let endPage = Math.min(totalPages, startPage + 6);
      if (endPage - startPage < 6) startPage = Math.max(1, endPage - 6);
      for (let p = startPage; p <= endPage; p++) {
        html += `<button class="year-btn${p === currentPage ? ' active' : ''}" onclick="examPage(${p})">${p}</button>`;
      }
      if (currentPage < totalPages) {
        html += `<button class="year-btn" onclick="examPage(${currentPage + 1})">下一页 →</button>`;
      }
      html += `</div>`;
    }

    container.innerHTML = html;

    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([container]).catch(() => {});
    }
  }

  function examPage(page) {
    currentPage = page;
    renderExamQuestions();
    document.getElementById('sec-exambank').scrollIntoView({ behavior: 'smooth' });
  }

  function copyText(text) {
    // execCommand 回退：用于 clipboard API 不可用（非安全上下文）或被拒绝（如文档未聚焦）
    const fallback = function() {
      return new Promise(function(resolve, reject) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
        } catch (e) {
          reject(e);
        }
        ta.remove();
      });
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(fallback);
    }
    return fallback();
  }

  function copyExamQuestion(btn, i) {
    const item = currentItems[i];
    if (!item) return;
    const text = String(item[3] || '').replace(/\r/g, '').trim();
    const label = btn.textContent;
    const restore = function() {
      btn.textContent = label;
      btn.disabled = false;
    };
    copyText(text).then(function() {
      btn.textContent = '已复制 ✓';
      btn.disabled = true;
      setTimeout(restore, 1500);
    }).catch(function() {
      btn.textContent = '复制失败';
      btn.disabled = true;
      setTimeout(restore, 1500);
    });
  }

  function toggleExamAnswer(btn) {
    const card = btn.closest('.q-card');
    const text = card && card.querySelector('.q-text');
    const hidden = text && text.nextElementSibling;
    if (!hidden) return;
    if (hidden.classList.contains('q-hidden')) {
      hidden.classList.remove('q-hidden');
      btn.textContent = '收起解答';
      if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([hidden]).catch(() => {});
      }
    } else {
      hidden.classList.add('q-hidden');
      btn.textContent = '查看解答';
    }
  }

  window.filterExamYear = filterExamYear;
  window.filterExamType = filterExamType;
  window.toggleExamAnswer = toggleExamAnswer;
  window.examPage = examPage;
  window.copyExamQuestion = copyExamQuestion;
  window.initExamBank = initExamBank;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExamBank);
  } else {
    initExamBank();
  }
})();
