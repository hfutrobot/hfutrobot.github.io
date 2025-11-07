// MathJax 配置文件 - 自动渲染LaTeX公式
(function() {
  // 检查页面是否需要MathJax
  function needsMathJax() {
    // 检查是否有数学公式标记
    const hasInlineMath = document.body.innerHTML.includes('$') && 
                         (document.body.innerHTML.match(/\$[^$]+\$/g) || []).length > 0;
    const hasDisplayMath = document.body.innerHTML.includes('$$');
    const hasMathScript = document.querySelector('script[type*="math/tex"]');
    
    return hasInlineMath || hasDisplayMath || hasMathScript || 
           document.querySelector('meta[name="math"]') ||
           document.documentElement.classList.contains('math-enabled');
  }

  // 如果页面不需要数学公式，直接返回
  if (!needsMathJax()) {
    return;
  }

  // 配置MathJax
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true,
      packages: ['base', 'ams', 'noerrors', 'noundefined', 'autoload'],
      tags: 'ams'
    },
    options: {
      ignoreHtmlClass: 'tex2jax_ignore',
      processHtmlClass: 'tex2jax_process'
    },
    startup: {
      ready() {
        MathJax.startup.defaultReady();
        MathJax.startup.promise.then(() => {
          console.log('MathJax initial typesetting complete');
          
          // 处理 script[type="math/tex"] 标签
          const mathScripts = document.querySelectorAll('script[type*="math/tex"]');
          mathScripts.forEach(script => {
            const math = script.textContent || script.innerText;
            const isDisplay = script.type.includes('display');
            
            const span = document.createElement('span');
            if (isDisplay) {
              span.innerHTML = `\\[${math}\\]`;
              span.style.display = 'block';
              span.style.textAlign = 'center';
            } else {
              span.innerHTML = `\\(${math}\\)`;
            }
            
            script.parentNode.replaceChild(span, script);
          });
          
          // 重新渲染
          MathJax.typesetPromise().then(() => {
            console.log('MathJax script tag processing complete');
          });
        });
      }
    }
  };

  // 动态加载MathJax
  const script = document.createElement('script');
  script.src = 'https://lib.baomitu.com/mathjax/3.2.2/es5/tex-mml-chtml.js';
  script.async = true;
  document.head.appendChild(script);

  // 自动扫描页面中的数学公式
  function renderMathJax() {
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      MathJax.typesetPromise().then(() => {
        console.log('MathJax re-rendering complete');
      }).catch((err) => console.log('MathJax rendering error:', err));
    }
  }

  // 导出函数供其他地方调用
  window.renderMathJax = renderMathJax;
})();