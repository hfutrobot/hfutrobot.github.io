// MathJax 增强配置 - 主题已内置 MathJax，此文件仅用于额外优化
// Enhanced MathJax configuration - Theme already includes MathJax, this file is for additional optimizations

(function() {
  'use strict';
  
  // 等待页面和 MathJax 加载完成
  function initMathJaxEnhancement() {
    // 检查 MathJax 是否已加载（由主题加载）
    if (typeof MathJax === 'undefined') {
      // 如果还没加载，等待一下再试
      setTimeout(initMathJaxEnhancement, 100);
      return;
    }

    console.log('MathJax detected, applying enhancements...');

    // 初始化复制按钮功能
    function initCopyButtons() {
      const copyButtons = document.querySelectorAll('.math-copy-btn');
      copyButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const wrapper = btn.closest('.math-formula-wrapper');
          const mathSpan = wrapper ? wrapper.querySelector('.math[data-latex]') : null;
          if (!mathSpan) return;
          
          const latexCode = mathSpan.getAttribute('data-latex');
          if (!latexCode) return;
          
          // 解码 HTML 实体
          const textarea = document.createElement('textarea');
          textarea.value = latexCode
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
          
          document.body.appendChild(textarea);
          textarea.select();
          
          try {
            document.execCommand('copy');
            // 显示成功提示
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            btn.style.color = '#10b981';
            setTimeout(function() {
              btn.innerHTML = originalHTML;
              btn.style.color = '';
            }, 2000);
          } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动选择文本');
          }
          
          document.body.removeChild(textarea);
        });
      });
    }

    // 解码 HTML 实体的工具函数
    function decodeHtmlEntities(str) {
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }

    // 创建工具提示
    function createTooltip(text, targetElement) {
      const tooltip = document.createElement('div');
      tooltip.className = 'math-tooltip';
      tooltip.textContent = text;
      document.body.appendChild(tooltip);
      
      const rect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      // 计算位置，避免超出视窗
      let top = rect.top - tooltipRect.height - 8;
      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      
      // 如果上方空间不够，显示在下方
      if (top < 0) {
        top = rect.bottom + 8;
      }
      
      // 如果左侧超出，调整位置
      if (left < 10) {
        left = 10;
      } else if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      
      tooltip.style.top = top + 'px';
      tooltip.style.left = left + 'px';
      
      return tooltip;
    }

    // 为行内公式添加 hover 显示源代码功能
    function initInlineFormulaTooltip() {
      const inlineFormulas = document.querySelectorAll('.math.inline[data-latex]');
      inlineFormulas.forEach(function(formula) {
        let tooltip = null;
        let tooltipTimeout = null;
        
        formula.addEventListener('mouseenter', function(e) {
          // 清除之前的延迟
          if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
          }
          
          const latexCode = formula.getAttribute('data-latex');
          if (!latexCode) return;
          
          // 延迟显示，避免鼠标快速移动时频繁创建
          tooltipTimeout = setTimeout(function() {
            const decoded = decodeHtmlEntities(latexCode);
            tooltip = createTooltip(decoded, formula);
          }, 200);
        });
        
        formula.addEventListener('mouseleave', function() {
          if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
          }
          if (tooltip) {
            tooltip.remove();
            tooltip = null;
          }
        });
        
        // 点击复制
        formula.addEventListener('click', function(e) {
          const latexCode = formula.getAttribute('data-latex');
          if (!latexCode) return;
          
          const decoded = decodeHtmlEntities(latexCode);
          
          const textarea = document.createElement('textarea');
          textarea.value = decoded;
          document.body.appendChild(textarea);
          textarea.select();
          
          try {
            document.execCommand('copy');
            // 显示提示
            if (tooltip) {
              tooltip.textContent = '已复制！';
              tooltip.style.color = '#10b981';
              setTimeout(function() {
                if (tooltip) tooltip.remove();
                tooltip = null;
              }, 1000);
            }
          } catch (err) {
            console.error('复制失败:', err);
          }
          
          document.body.removeChild(textarea);
        });
      });
    }

    // 为块级公式添加 hover 显示源代码功能
    function initDisplayFormulaTooltip() {
      const displayFormulas = document.querySelectorAll('.math.display[data-latex]');
      displayFormulas.forEach(function(formula) {
        let tooltip = null;
        let tooltipTimeout = null;
        
        formula.addEventListener('mouseenter', function(e) {
          // 清除之前的延迟
          if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
          }
          
          const latexCode = formula.getAttribute('data-latex');
          if (!latexCode) return;
          
          // 延迟显示，避免鼠标快速移动时频繁创建
          tooltipTimeout = setTimeout(function() {
            const decoded = decodeHtmlEntities(latexCode);
            tooltip = createTooltip(decoded, formula);
          }, 200);
        });
        
        formula.addEventListener('mouseleave', function() {
          if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
          }
          if (tooltip) {
            tooltip.remove();
            tooltip = null;
          }
        });
      });
    }

    // 初始化所有功能
    function initAllFeatures() {
      initCopyButtons();
      initInlineFormulaTooltip();
      initDisplayFormulaTooltip();
    }

    // 防抖函数
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = function() {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // 优化的初始化函数（防抖处理）
    const debouncedInit = debounce(function() {
      if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise().then(function() {
          initAllFeatures();
        }).catch(function(err) {
          console.log('MathJax render (non-critical):', err);
        });
      } else {
        initAllFeatures();
      }
    }, 500);

    // 确保数学公式在动态内容加载后也能正确渲染
    // 使用更严格的观察器配置，减少不必要的触发
    const observer = new MutationObserver(function(mutations) {
      // 只处理实际添加了数学公式的变更
      let hasMathContent = false;
      for (let mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (let node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              if (node.classList && (node.classList.contains('math') || node.querySelector('.math'))) {
                hasMathContent = true;
                break;
              }
            }
          }
        }
        if (hasMathContent) break;
      }
      
      if (hasMathContent && typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        debouncedInit();
      }
    });

    // 观察内容变化（只观察子节点变化，减少触发频率）
    const contentElement = document.querySelector('.markdown-body') || document.body;
    if (contentElement) {
      observer.observe(contentElement, {
        childList: true,
        subtree: true,
        // 不观察属性变化，减少触发
        attributes: false,
        characterData: false
      });
    }

    // 页面加载完成后确保渲染
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(function() {
        debouncedInit();
      }, 500);
    } else {
      // 如果还没加载完，先初始化一次
      setTimeout(function() {
        debouncedInit();
      }, 1000);
    }
  }

  // 启动增强功能
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMathJaxEnhancement);
  } else {
    initMathJaxEnhancement();
  }
})();
