export function requestFullscreen() {
  const doc = document.documentElement;
  if (doc.requestFullscreen) {
    doc.requestFullscreen();
  } else if (doc.webkitRequestFullscreen) { // Safari
    doc.webkitRequestFullscreen();
  } else if (doc.msRequestFullscreen) { // IE11
    doc.msRequestFullscreen();
  }
}

export function exitFullscreen() {
  const doc = document;
  if (doc.exitFullscreen) {
    doc.exitFullscreen();
  } else if (doc.webkitExitFullscreen) { // Safari
    doc.webkitExitFullscreen();
  } else if (doc.msExitFullscreen) { // IE11
    doc.msExitFullscreen();
  }
}

export function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}

export function onFullscreenChange(callback) {
  const handler = () => callback(isFullscreen());
  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  document.addEventListener('msfullscreenchange', handler);
  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('msfullscreenchange', handler);
  };
}