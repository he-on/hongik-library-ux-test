/* UX prototype: lightweight feedback for controls that have no implemented action.
   Do not use a blocking alert or a modal for a placeholder. */
(() => {
  "use strict";
  const css = document.createElement("style");
  css.textContent = `
    .ux-toast-notice {
      position:fixed;left:50%;bottom:max(24px,env(safe-area-inset-bottom,24px));
      transform:translate(-50%,12px);z-index:2147483000;
      width:max-content;max-width:min(540px,calc(100vw - 32px));
      box-sizing:border-box;padding:13px 20px;border-radius:12px;
      background:rgba(24,33,55,.96);color:#fff;
      font-family:Arial,"Malgun Gothic",sans-serif;font-size:14px;line-height:1.5;
      text-align:center;box-shadow:0 8px 28px rgba(0,0,0,.22);
      pointer-events:none;opacity:0;transition:opacity .2s ease,transform .2s ease;
    }
    .ux-toast-notice.is-visible {opacity:1;transform:translate(-50%,0)}
    @media (prefers-reduced-motion:reduce) {
      .ux-toast-notice {transition:none}
    }
  `;
  document.head.appendChild(css);
  let toast, hideTimer;
  window.uxNotice = function(message) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "ux-toast-notice";
      toast.setAttribute("role","status");
      toast.setAttribute("aria-live","polite");
      toast.setAttribute("aria-atomic","true");
      document.body.appendChild(toast);
    }
    clearTimeout(hideTimer);
    toast.textContent = String(message || "이 기능은 현재 시연에서 제공되지 않습니다.").slice(0,250);
    toast.classList.remove("is-visible");
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("is-visible")));
    hideTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };
})();
