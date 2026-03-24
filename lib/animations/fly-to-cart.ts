"use client";

type FlyToCartOptions = {
  sourceElement: HTMLElement;
  cartSelector?: string;
};

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export async function runFlyToCartAnimation({
  sourceElement,
  cartSelector = "[data-cart-icon]",
}: FlyToCartOptions) {
  const cartElement = document.querySelector(cartSelector) as HTMLElement | null;
  if (!cartElement) return;

  const sourceImage = sourceElement.querySelector("img") as HTMLImageElement | null;
  const sourceRect = (sourceImage ?? sourceElement).getBoundingClientRect();
  const targetRect = cartElement.getBoundingClientRect();

  const flyNode = document.createElement("div");
  flyNode.style.position = "fixed";
  flyNode.style.left = `${sourceRect.left}px`;
  flyNode.style.top = `${sourceRect.top}px`;
  flyNode.style.width = `${Math.max(22, Math.min(64, sourceRect.width * 0.32))}px`;
  flyNode.style.height = `${Math.max(22, Math.min(64, sourceRect.width * 0.32))}px`;
  flyNode.style.borderRadius = "9999px";
  flyNode.style.zIndex = "70";
  flyNode.style.pointerEvents = "none";
  flyNode.style.overflow = "hidden";
  flyNode.style.boxShadow = "0 14px 28px rgba(46,46,46,0.2)";
  flyNode.style.willChange = "transform, opacity";
  flyNode.style.opacity = "0.98";
  flyNode.style.background = "var(--olive)";

  if (sourceImage?.src) {
    flyNode.style.backgroundImage = `url("${sourceImage.src}")`;
    flyNode.style.backgroundSize = "cover";
    flyNode.style.backgroundPosition = "center";
  }

  document.body.appendChild(flyNode);

  // Let browser commit element before animating.
  await wait(16);

  const startCenterX = sourceRect.left + flyNode.offsetWidth / 2;
  const startCenterY = sourceRect.top + flyNode.offsetHeight / 2;
  const endCenterX = targetRect.left + targetRect.width / 2;
  const endCenterY = targetRect.top + targetRect.height / 2;
  const dx = endCenterX - startCenterX;
  const dy = endCenterY - startCenterY;

  // Slight upward arc before descent to cart.
  const arcX = dx * 0.45;
  const arcY = dy * 0.45 - 44;

  flyNode.animate(
    [
      { transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)", opacity: 0.98, offset: 0 },
      {
        transform: `translate3d(${arcX}px, ${arcY}px, 0) scale(0.82) rotate(4deg)`,
        opacity: 0.95,
        offset: 0.58,
      },
      {
        transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.58) rotate(0deg)`,
        opacity: 0.2,
        offset: 1,
      },
    ],
    {
      duration: 620,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    },
  );

  await wait(640);
  flyNode.remove();

  // Landing feedback on cart anchor.
  cartElement.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.15)" },
      { transform: "scale(1.02)" },
      { transform: "scale(1)" },
    ],
    {
      duration: 320,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  );
}
