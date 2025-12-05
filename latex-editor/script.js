// Initialize CodeMirror
var editor = CodeMirror.fromTextArea(document.getElementById("latex-input"), {
    mode: "stex",
    lineNumbers: true,
    lineWrapping: true,
    theme: "default",
    autofocus: true
});

editor.setValue("E = mc^2");

// MathJax Rendering Logic
var preview = document.getElementById("latex-preview");
var isRendering = false;
var pendingText = null;

function renderLatex() {
    // Check if MathJax is loaded
    if (typeof MathJax === 'undefined' || !MathJax.typesetPromise) {
        console.warn('MathJax not ready yet, retrying...');
        setTimeout(renderLatex, 100);
        return;
    }

    if (isRendering) {
        pendingText = editor.getValue();
        return;
    }

    var text = pendingText !== null ? pendingText : editor.getValue();
    pendingText = null;
    isRendering = true;

    preview.innerHTML = '$$' + text + '$$';

    MathJax.typesetPromise([preview]).then(function () {
        isRendering = false;
        if (pendingText !== null) {
            renderLatex();
        }
    }).catch(function (err) {
        console.error(err);
        isRendering = false;
    });
}

editor.on("change", function () {
    renderLatex();
});

// Wait for MathJax to load before initial render
function waitForMathJax() {
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        renderLatex();
    } else {
        setTimeout(waitForMathJax, 100);
    }
}
waitForMathJax();

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.editor-tab').forEach(function (el) {
        el.classList.remove('active');
    });
    event.target.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(function (el) {
        el.style.display = 'none';
    });
    document.getElementById('tab-' + tabName).style.display = 'block';
}

// Hover Menu Logic
var toolbarContainer = document.querySelector('.toolbar-container');
var symbolPanelContainer = document.querySelector('.symbol-panel-container');
var hideTimeout;

function showCategory(catName) {
    clearTimeout(hideTimeout);

    // Highlight category button
    document.querySelectorAll('.category-btn').forEach(function (el) {
        el.classList.remove('active');
    });
    var btn = document.querySelector(`.category-btn[data-cat="${catName}"]`);
    if (btn) btn.classList.add('active');

    // Show symbol group
    document.querySelectorAll('.symbol-group').forEach(function (el) {
        el.classList.remove('active');
    });
    var group = document.getElementById('cat-' + catName);
    if (group) group.classList.add('active');

    // Position and show panel below the active button with smart alignment
    if (symbolPanelContainer && btn) {
        var btnRect = btn.getBoundingClientRect();
        var categoryBar = document.querySelector('.category-bar');
        var barRect = categoryBar.getBoundingClientRect();
        var toolbarRect = toolbarContainer.getBoundingClientRect();

        // Determine if button is on left or right half of screen
        var screenCenter = window.innerWidth / 2;
        var btnCenter = btnRect.left + btnRect.width / 2;

        // Calculate top relative to the toolbar container
        // The panel is inside toolbar-container (or we treat it as such for absolute positioning context)
        // If the container has position: relative, we need coordinates relative to it.
        // Let's assume symbolPanelContainer is a child of body or a relative container.
        // Based on HTML structure, it's inside .toolbar-container.

        // Actually, looking at index.md, symbolPanelContainer is inside .toolbar-container > #tab-shortcuts
        // Let's check if .toolbar-container or parent has position: relative.
        // style.css says .toolbar-container { position: relative; }

        // So we need top/left relative to .toolbar-container.

        // Top should be just below the category bar.
        // categoryBar is inside .toolbar-container.
        symbolPanelContainer.style.top = (categoryBar.offsetTop + categoryBar.offsetHeight) + 'px';

        if (btnCenter < screenCenter) {
            // Button on left: left-align panel with button
            // We need button's left relative to toolbar-container
            // Since btn is inside categoryBar which is inside toolbarContainer, 
            // and categoryBar might scroll, we need to be careful.
            // Simplest is: btnRect.left - toolbarRect.left
            symbolPanelContainer.style.left = (btnRect.left - toolbarRect.left) + 'px';
            symbolPanelContainer.style.right = 'auto';
        } else {
            // Button on right: right-align panel with button
            // Right edge relative to container right edge
            var containerRight = toolbarRect.right;
            var btnRight = btnRect.right;
            symbolPanelContainer.style.right = (containerRight - btnRight) + 'px';
            symbolPanelContainer.style.left = 'auto';
        }

        symbolPanelContainer.style.display = 'block';
    }
}

function hidePanel() {
    hideTimeout = setTimeout(function () {
        if (symbolPanelContainer) {
            symbolPanelContainer.style.display = 'none';
        }
        document.querySelectorAll('.category-btn').forEach(function (el) {
            el.classList.remove('active');
        });
    }, 200);
}

// Tooltip Logic
var tooltip = document.createElement('div');
tooltip.className = 'latex-tooltip';
document.body.appendChild(tooltip);

function showTooltip(e, cmd, descCn, descEn) {
    tooltip.innerHTML = `
    <span class="tooltip-cmd">${cmd}</span>
    <span class="tooltip-desc">${descCn || ''}</span>
    ${descEn ? `<span class="tooltip-desc-en">${descEn}</span>` : ''}
  `;
    tooltip.style.display = 'block';
    moveTooltip(e);
}

function moveTooltip(e) {
    var x = e.clientX + 15;
    var y = e.clientY + 15;

    // Boundary check
    if (x + tooltip.offsetWidth > window.innerWidth) {
        x = e.clientX - tooltip.offsetWidth - 10;
    }
    if (y + tooltip.offsetHeight > window.innerHeight) {
        y = e.clientY - tooltip.offsetHeight - 10;
    }

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function hideTooltip() {
    tooltip.style.display = 'none';
}

// Attach Event Listeners
function attachButtonListeners() {
    document.querySelectorAll('.symbol-btn').forEach(function (btn) {
        // Click handler
        var onclickVal = btn.getAttribute('onclick');
        if (!onclickVal) { // If onclick is not set inline (we set it via data-cmd)
            var cmd = btn.getAttribute('data-cmd');
            if (cmd) {
                btn.onclick = function () { insertCmd(cmd); };
            }
        }

        // Tooltip handlers
        var cmd = btn.getAttribute('data-cmd') || (onclickVal ? onclickVal.match(/'([^']+)'/)[1] : '');
        var descCn = btn.getAttribute('data-desc-cn');
        var descEn = btn.getAttribute('data-desc-en');

        if (cmd) {
            btn.onmouseenter = function (e) { showTooltip(e, cmd, descCn, descEn); };
            btn.onmousemove = function (e) { moveTooltip(e); };
            btn.onmouseleave = function () { hideTooltip(); };
        }
    });
}

// Attach listeners for category hover
document.querySelectorAll('.category-btn').forEach(function (btn) {
    var catName = btn.getAttribute('data-cat');
    if (catName) {
        btn.onmouseenter = function () {
            showCategory(catName);
        };
        // Keep onclick for mobile/touch or direct clicks
        // The onclick attribute in HTML already handles the click
    }
});

if (toolbarContainer) {
    toolbarContainer.onmouseleave = function () {
        hidePanel();
    };
}

if (symbolPanelContainer) {
    symbolPanelContainer.onmouseenter = function () {
        clearTimeout(hideTimeout);
    };

    symbolPanelContainer.onmouseleave = function () {
        hidePanel();
    };
}

// Call this after DOM load
attachButtonListeners();

// Render LaTeX in symbol buttons - wait for MathJax
function renderSymbolButtons() {
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise(document.querySelectorAll('.symbol-btn')).catch(function (err) {
            console.error('MathJax button rendering error:', err);
        });
    } else {
        setTimeout(renderSymbolButtons, 100);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    renderSymbolButtons();
});

// Make functions globally accessible for onclick handlers
window.switchTab = switchTab;
window.switchCategory = showCategory;
window.insertCmd = insertCmd;
window.clearEditor = clearEditor;
window.copyCode = copyCode;
window.exportSVG = exportSVG;
window.exportPNG = exportPNG;

function insertCmd(cmd) {
    var doc = editor.getDoc();
    var cursor = doc.getCursor();
    doc.replaceRange(cmd, cursor);
    editor.focus();
}

function clearEditor() {
    editor.setValue("");
    editor.focus();
}

function copyCode() {
    var text = editor.getValue();
    navigator.clipboard.writeText(text).then(function () {
        showToast('已复制到剪贴板');
    }).catch(function (err) {
        showToast('复制失败');
    });
}

function showToast(message) {
    var toast = document.getElementById("toast");
    if (toast) {
        toast.textContent = message;
        toast.className = "show";
        setTimeout(function () {
            toast.className = "";
        }, 3000);
    }
}

function exportSVG() {
    var svg = preview.querySelector('svg');
    if (!svg) {
        showToast('请先生成预览');
        return;
    }

    try {
        var svgClone = svg.cloneNode(true);
        svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

        // Copy MathJax fonts/defs
        var allDefs = document.querySelectorAll('svg defs');
        var combinedDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        allDefs.forEach(function (defsElement) {
            Array.from(defsElement.children).forEach(function (child) {
                combinedDefs.appendChild(child.cloneNode(true));
            });
        });
        if (combinedDefs.children.length > 0) {
            svgClone.insertBefore(combinedDefs, svgClone.firstChild);
        }

        // Copy styles
        var styles = document.querySelectorAll('#latex-preview style, svg style');
        styles.forEach(function (style) {
            var styleClone = style.cloneNode(true);
            svgClone.insertBefore(styleClone, svgClone.firstChild);
        });

        // Ensure dimensions
        var bbox = svg.getBoundingClientRect();
        if (!svgClone.hasAttribute('viewBox')) {
            svgClone.setAttribute('viewBox', '0 0 ' + bbox.width + ' ' + bbox.height);
        }
        // MathJax uses 'ex' units, which can be problematic for some viewers. 
        // We keep them for SVG but ensure viewBox is correct.
        if (!svgClone.getAttribute('width')) svgClone.setAttribute('width', bbox.width);
        if (!svgClone.getAttribute('height')) svgClone.setAttribute('height', bbox.height);

        // Always use black color for export (don't inherit theme color)
        svgClone.style.color = '#000000';

        var svgData = new XMLSerializer().serializeToString(svgClone);
        var blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        var url = URL.createObjectURL(blob);

        var link = document.createElement("a");
        link.href = url;
        link.download = "latex_formula.svg";
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Delay revoking URL to allow browser time to complete the download
        setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1000);

        showToast('SVG 导出成功');
    } catch (error) {
        console.error(error);
        showToast('导出失败');
    }
}

function exportPNG() {
    var svg = preview.querySelector('svg');
    if (!svg) {
        showToast('请先生成预览');
        return;
    }

    try {
        var canvas = document.getElementById('export-canvas');
        var ctx = canvas.getContext('2d');

        var svgClone = svg.cloneNode(true);
        svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

        // Copy MathJax fonts/defs
        var allDefs = document.querySelectorAll('svg defs');
        var combinedDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        allDefs.forEach(function (defsElement) {
            Array.from(defsElement.children).forEach(function (child) {
                combinedDefs.appendChild(child.cloneNode(true));
            });
        });
        if (combinedDefs.children.length > 0) {
            svgClone.insertBefore(combinedDefs, svgClone.firstChild);
        }

        // Copy styles
        var styles = document.querySelectorAll('#latex-preview style, svg style');
        styles.forEach(function (style) {
            var styleClone = style.cloneNode(true);
            svgClone.insertBefore(styleClone, svgClone.firstChild);
        });

        // Always use black color for export (don't inherit theme color)
        svgClone.style.color = '#000000';

        // Get accurate pixel dimensions
        var bbox = svg.getBoundingClientRect();
        var width = bbox.width;
        var height = bbox.height;

        // Force pixel units on the clone for drawing
        svgClone.setAttribute('width', width);
        svgClone.setAttribute('height', height);
        if (!svgClone.hasAttribute('viewBox')) {
            svgClone.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        }

        var svgData = new XMLSerializer().serializeToString(svgClone);
        var img = new Image();
        var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        var url = URL.createObjectURL(svgBlob);

        img.onload = function () {
            var scale = 5; // High resolution
            var padding = 40;
            canvas.width = width * scale + padding * 2;
            canvas.height = height * scale + padding * 2;

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw image centered
            ctx.drawImage(img, padding, padding, width * scale, height * scale);

            var pngDataUrl = canvas.toDataURL("image/png");
            var link = document.createElement("a");
            link.href = pngDataUrl;
            link.download = "latex_formula.png";
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast('PNG 导出成功');
        };

        img.onerror = function (e) {
            console.error("Image load error", e);
            showToast('PNG 导出失败');
            URL.revokeObjectURL(url);
        };

        img.src = url;
    } catch (error) {
        console.error(error);
        showToast('导出失败');
    }
}
