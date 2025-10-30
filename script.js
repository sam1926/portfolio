// Register GSAP plugins
gsap.registerPlugin(Draggable, InertiaPlugin, CustomEase, Flip);

class PreloaderManager {
  constructor() {
    this.overlay = null;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.startTime = null;
    this.duration = 2000; // 2 seconds
    this.createLoadingScreen();
  }

  createLoadingScreen() {
    this.overlay = document.getElementById("preloader-overlay");
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100000;
    `;

    this.canvas = document.createElement("canvas");
    this.canvas.width = 300;
    this.canvas.height = 300;

    this.ctx = this.canvas.getContext("2d");
    this.overlay.appendChild(this.canvas);

    this.startAnimation();
  }

  startAnimation() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    let time = 0;
    let lastTime = 0;

    const dotRings = [
      { radius: 20, count: 8 },
      { radius: 35, count: 12 },
      { radius: 50, count: 16 },
      { radius: 65, count: 20 },
      { radius: 80, count: 24 }
    ];

    const colors = {
      primary: "#2C1B14",
      accent: "#A64B23"
    };

    const hexToRgb = (hex) => {
      return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
      ];
    };

    const animate = (timestamp) => {
      if (!this.startTime) this.startTime = timestamp;

      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw center dot
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      const rgb = hexToRgb(colors.primary);
      this.ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.9)`;
      this.ctx.fill();

      // Draw Line Pulse Wave animation
      dotRings.forEach((ring, ringIndex) => {
        for (let i = 0; i < ring.count; i++) {
          const angle = (i / ring.count) * Math.PI * 2;
          const radiusPulse = Math.sin(time * 2 - ringIndex * 0.4) * 3;
          const x = centerX + Math.cos(angle) * (ring.radius + radiusPulse);
          const y = centerY + Math.sin(angle) * (ring.radius + radiusPulse);

          const opacityWave =
            0.4 + Math.sin(time * 2 - ringIndex * 0.4 + i * 0.2) * 0.6;
          const isActive = Math.sin(time * 2 - ringIndex * 0.4 + i * 0.2) > 0.6;

          // Draw line from center to point
          this.ctx.beginPath();
          this.ctx.moveTo(centerX, centerY);
          this.ctx.lineTo(x, y);
          this.ctx.lineWidth = 0.8;

          if (isActive) {
            const accentRgb = hexToRgb(colors.accent);
            this.ctx.strokeStyle = `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${
              accentRgb[2]
            }, ${opacityWave * 0.7})`;
          } else {
            const primaryRgb = hexToRgb(colors.primary);
            this.ctx.strokeStyle = `rgba(${primaryRgb[0]}, ${primaryRgb[1]}, ${
              primaryRgb[2]
            }, ${opacityWave * 0.5})`;
          }
          this.ctx.stroke();

          // Draw dot at the end of the line
          this.ctx.beginPath();
          this.ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          if (isActive) {
            const accentRgb = hexToRgb(colors.accent);
            this.ctx.fillStyle = `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, ${opacityWave})`;
          } else {
            const primaryRgb = hexToRgb(colors.primary);
            this.ctx.fillStyle = `rgba(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]}, ${opacityWave})`;
          }
          this.ctx.fill();
        }
      });

      // Check if we should complete the loading
      if (timestamp - this.startTime >= this.duration) {
        this.complete();
        return;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  complete(onComplete) {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.overlay) {
      this.overlay.style.opacity = "0";
      this.overlay.style.transition = "opacity 0.8s ease";
      setTimeout(() => {
        this.overlay?.remove();
        if (onComplete) onComplete();
      }, 800);
    }
  }
}

class FashionGallery {
  constructor() {
    // DOM elements
    this.viewport = document.getElementById("viewport");
    this.canvasWrapper = document.getElementById("canvasWrapper");
    this.gridContainer = document.getElementById("gridContainer");
    this.splitScreenContainer = document.getElementById("splitScreenContainer");
    this.imageTitleOverlay = document.getElementById("imageTitleOverlay");
    this.closeButton = document.getElementById("closeButton");
    // Create custom eases
    this.customEase = CustomEase.create("smooth", ".87,0,.13,1");
    this.centerEase = CustomEase.create("center", ".25,.46,.45,.94");
    // Configuration
    this.config = {
      itemSize: 320,
      baseGap: 16,
      rows: 8,
      cols: 12,
      currentZoom: 1.35,
      currentGap: 32
    };
    // State
    this.zoomState = {
      isActive: false,
      selectedItem: null,
      flipAnimation: null,
      scalingOverlay: null
    };
    this.gridItems = [];
    this.gridDimensions = {};
    this.lastValidPosition = {
      x: 0,
      y: 0
    };
    this.draggable = null;
    this.viewportObserver = null;
    // Initialize sound system
    this.initSoundSystem();
    // Initialize image data
    this.initImageData();
  }
  initSoundSystem() {
    this.soundSystem = {
      enabled: true,
      sounds: {
        click: new Audio("https://assets.codepen.io/7558/glitch-fx-001.mp3"),
        open: new Audio("https://assets.codepen.io/7558/click-glitch-001.mp3"),
        close: new Audio("https://assets.codepen.io/7558/click-glitch-001.mp3"),
        "zoom-in": new Audio(
          "https://assets.codepen.io/7558/whoosh-fx-001.mp3"
        ),
        "zoom-out": new Audio(
          "https://assets.codepen.io/7558/whoosh-fx-001.mp3"
        ),
        "drag-start": new Audio(
          "https://assets.codepen.io/7558/preloader-2s-001.mp3"
        ),
        "drag-end": new Audio(
          "https://assets.codepen.io/7558/preloader-2s-001.mp3"
        )
      },
      play: (soundName) => {
        if (!this.soundSystem.enabled || !this.soundSystem.sounds[soundName])
          return;
        try {
          const audio = this.soundSystem.sounds[soundName];
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } catch (e) {
          // Silently handle audio errors
        }
      }
    };
    // Preload sounds
    Object.values(this.soundSystem.sounds).forEach((audio) => {
      audio.preload = "auto";
      audio.volume = 0.3;
    });
  }
  initImageData() {
    // Fashion portrait images
    this.fashionImages = [];
    for (let i = 1; i <= 14; i++) {
      const paddedNumber = String(i).padStart(2, "0");
      this.fashionImages.push(
        `https://assets.codepen.io/7558/orange-portrait_${paddedNumber}.jpg`
      );
    }
    // Image data for titles and descriptions
    this.imageData = [
      {
        number: "01",
        title: "Begin Before You’re Ready",
        description:
          "The work starts when you notice the quiet pull. Breathe once, clear the room inside you, and move one pixel forward."
      },
      {
        number: "02",
        title: "Negative Space, Positive Signal",
        description:
          "Leave room around the idea. In the silence, the design answers back and shows you what to remove."
      },
      {
        number: "03",
        title: "Friction Is a Teacher",
        description:
          "When the line resists, listen. Constraints are coordinates—plot them, then chart a cleaner route."
      },
      {
        number: "04",
        title: "Golden Minute",
        description:
          "Catch the light while it’s honest. One honest frame beats a hundred almosts."
      },
      {
        number: "05",
        title: "Shadow Carries Form",
        description:
          "The dark reveals the edge. Let contrast articulate what you mean but can’t yet say."
      },
      {
        number: "06",
        title: "City Breath",
        description:
          "Steel, glass, heartbeat. Edit until the street’s rhythm fits inside a single grid."
      },
      {
        number: "07",
        title: "Soft Focus, Sharp Intent",
        description:
          "Blur the noise, not the purpose. What matters remains in crisp relief."
      },
      {
        number: "08",
        title: "Time-Tested, Future-Ready",
        description:
          "Classics survive because they serve. Keep the spine, tune the surface, respect the lineage."
      },
      {
        number: "09",
        title: "Grace Under Revision",
        description:
          "Drafts don’t apologize. They evolve. Let elegance emerge through cuts, not flourishes."
      },
      {
        number: "10",
        title: "Style That Outlasts Seasons",
        description:
          "Trends talk. Principles walk. Build on principles and let trends accessorize."
      },
      {
        number: "11",
        title: "Edges and Experiments",
        description:
          "Push just past comfort. Leave a fingerprint the algorithm can’t fake."
      },
      {
        number: "12",
        title: "Portrait of Attention",
        description:
          "Form is what you see. Presence is what you feel. Aim for presence."
      },
      {
        number: "13",
        title: "Light Speaks First",
        description:
          "Expose for truth. Shadows are sentences, highlights the punctuation."
      },
      {
        number: "14",
        title: "Contemporary Is a Moving Target",
        description:
          "Design for now by listening deeper than now. The signal is older than the feed."
      },
      {
        number: "15",
        title: "Vision, Then Precision",
        description:
          "Dream wide, ship tight. Let imagination roam and execution walk in single-point focus."
      },
      {
        number: "16",
        title: "Geometry of Poise",
        description:
          "Angles carry attitude. Align posture, light, and line until the frame breathes."
      },
      {
        number: "17",
        title: "Natural Light, Natural Truth",
        description:
          "Open the window and remove the mask. Authenticity needs less wattage, more honesty."
      },
      {
        number: "18",
        title: "Studio: The Controlled Wild",
        description:
          "Dial every knob, then listen for the unscripted moment. Keep the lens ready."
      },
      {
        number: "19",
        title: "Invent the Angle",
        description:
          "Rotate the problem ninety degrees. Fresh perspective isn’t luck—it’s a habit."
      },
      {
        number: "20",
        title: "Editorial Nerve",
        description:
          "Carry yourself like you belong, then earn it with craft. The camera can tell."
      },
      {
        number: "21",
        title: "Profession Is Practice",
        description:
          "Repeat the fundamentals until they disappear. Mastery is subtle on purpose."
      },
      {
        number: "22",
        title: "Final Frame, Open Door",
        description:
          "Endings are launchpads. Archive the take, thank the light, and start again at one."
      }
    ];
  }
  // Custom line splitting function (since we can't use SplitText)
  splitTextIntoLines(element, text) {
    element.innerHTML = "";
    // Split by sentences and create lines
    const sentences = text.split(/(?<=[.!?])\s+/);
    const lines = [];
    // Create temporary div to measure text width
    const temp = document.createElement("div");
    temp.style.cssText = `
          position: absolute;
          visibility: hidden;
          width: ${element.offsetWidth}px;
          font-family: 'PPNeueMontreal', sans-serif;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.4;
        `;
    document.body.appendChild(temp);
    let currentLine = "";
    sentences.forEach((sentence) => {
      const words = sentence.split(" ");
      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        temp.textContent = testLine;
        if (temp.offsetWidth > element.offsetWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
    });
    if (currentLine) {
      lines.push(currentLine);
    }
    document.body.removeChild(temp);
    // Create line elements
    lines.forEach((lineText) => {
      const lineSpan = document.createElement("span");
      lineSpan.className = "description-line";
      lineSpan.textContent = lineText;
      element.appendChild(lineSpan);
    });
    return element.querySelectorAll(".description-line");
  }
  calculateGapForZoom(zoomLevel) {
    if (zoomLevel >= 1.0) return 16;
    else if (zoomLevel >= 0.6) return 32;
    else return 64;
  }
  calculateGridDimensions(gap = this.config.currentGap) {
    const totalWidth = this.config.cols * (this.config.itemSize + gap) - gap;
    const totalHeight = this.config.rows * (this.config.itemSize + gap) - gap;
    this.gridDimensions = {
      width: totalWidth,
      height: totalHeight,
      scaledWidth: totalWidth * this.config.currentZoom,
      scaledHeight: totalHeight * this.config.currentZoom,
      gap: gap
    };
    return this.gridDimensions;
  }
  generateGridItems() {
    this.config.currentGap = this.calculateGapForZoom(this.config.currentZoom);
    this.calculateGridDimensions();
    this.canvasWrapper.style.width = this.gridDimensions.width + "px";
    this.canvasWrapper.style.height = this.gridDimensions.height + "px";
    this.gridContainer.innerHTML = "";
    this.gridItems = [];

    let imageIndex = 0;
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        const item = document.createElement("div");
        item.className = "grid-item";

        // Calculate final grid position
        const x = col * (this.config.itemSize + this.config.currentGap);
        const y = row * (this.config.itemSize + this.config.currentGap);

        // Set to grid position
        item.style.left = `${x}px`;
        item.style.top = `${y}px`;

        // Hide initially - will be positioned and shown in playIntroAnimation
        item.style.opacity = "0";

        const imageUrl = this.fashionImages[
          imageIndex % this.fashionImages.length
        ];
        imageIndex++;
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = `Fashion Portrait ${imageIndex}`;
        item.appendChild(img);
        const itemData = {
          element: item,
          img: img,
          row: row,
          col: col,
          baseX: x,
          baseY: y,
          imageUrl: imageUrl,
          index: this.gridItems.length
        };
        // Add click event for zoom
        item.addEventListener("click", () => {
          if (!this.zoomState.isActive) {
            this.soundSystem.play("click");
            this.enterZoomMode(itemData);
          }
        });
        this.gridContainer.appendChild(item);
        this.gridItems.push(itemData);
      }
    }
  }
  setupViewportObserver() {
    if (this.viewportObserver) {
      this.viewportObserver.disconnect();
    }
    this.viewportObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Skip if this is the currently selected item in zoom mode
          if (
            this.zoomState.selectedItem &&
            entry.target === this.zoomState.selectedItem.element
          ) {
            return;
          }
          if (entry.isIntersecting) {
            entry.target.classList.remove("out-of-view");
            gsap.to(entry.target, {
              opacity: 1,
              duration: 0.6,
              ease: "power2.out"
            });
          } else {
            entry.target.classList.add("out-of-view");
            gsap.to(entry.target, {
              opacity: 0.1,
              duration: 0.6,
              ease: "power2.out"
            });
          }
        });
      },
      {
        root: null,
        threshold: 0.15,
        rootMargin: "10%"
      }
    );
    // Observe all grid items
    this.gridItems.forEach((item) => {
      this.viewportObserver.observe(item.element);
    });
  }
  updateTitleOverlay(imageIndex) {
    const data = this.imageData[imageIndex % this.imageData.length];
    const numberElement = document.querySelector("#imageSlideNumber span");
    const titleElement = document.querySelector("#imageSlideTitle h1");
    const descriptionElement = document.getElementById("imageSlideDescription");
    if (numberElement && titleElement && descriptionElement) {
      numberElement.textContent = data.number;
      titleElement.textContent = data.title;
      // Split description into lines
      this.descriptionLines = this.splitTextIntoLines(
        descriptionElement,
        data.description
      );
    }
  }
  createScalingOverlay(sourceImg) {
    const overlay = document.createElement("div");
    overlay.className = "scaling-image-overlay";
    const img = document.createElement("img");
    img.src = sourceImg.src;
    img.alt = sourceImg.alt;
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    const sourceRect = sourceImg.getBoundingClientRect();
    gsap.set(overlay, {
      left: sourceRect.left,
      top: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
      opacity: 1
    });
    return overlay;
  }
  enterZoomMode(selectedItemData) {
    if (this.zoomState.isActive) return;
    this.zoomState.isActive = true;
    this.zoomState.selectedItem = selectedItemData;
    this.soundSystem.play("open");
    // Disable dragging
    if (this.draggable) this.draggable.disable();
    document.body.classList.add("zoom-mode");
    const splitContainer = this.splitScreenContainer;
    const zoomTarget = document.getElementById("zoomTarget");
    splitContainer.classList.add("active");
    gsap.to(splitContainer, {
      opacity: 1,
      duration: 1.2,
      ease: this.customEase
    });
    this.zoomState.scalingOverlay = this.createScalingOverlay(
      selectedItemData.img
    );
    gsap.set(selectedItemData.img, {
      opacity: 0
    });
    this.zoomState.flipAnimation = Flip.fit(
      this.zoomState.scalingOverlay,
      zoomTarget,
      {
        duration: 1.2,
        ease: this.customEase,
        absolute: true,
        onComplete: () => {
          this.updateTitleOverlay(selectedItemData.index);
          const imageTitleOverlay = this.imageTitleOverlay;
          // Reset positions for animation
          gsap.set("#imageSlideNumber span", {
            y: 20,
            opacity: 0
          });
          gsap.set("#imageSlideTitle h1", {
            y: 60,
            opacity: 0
          });
          gsap.set(this.descriptionLines, {
            y: 80,
            opacity: 0
          });
          // Show overlay container immediately
          imageTitleOverlay.classList.add("active");
          gsap.to(imageTitleOverlay, {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
          });
          // Animate in number - much sooner
          gsap.to("#imageSlideNumber span", {
            duration: 0.8,
            y: 0,
            opacity: 1,
            ease: this.customEase,
            delay: 0.1
          });
          // Animate in title - sooner
          gsap.to("#imageSlideTitle h1", {
            duration: 0.8,
            y: 0,
            opacity: 1,
            ease: this.customEase,
            delay: 0.15
          });
          // Animate description lines one by one - much sooner
          gsap.to(this.descriptionLines, {
            duration: 0.8,
            y: 0,
            opacity: 1,
            ease: this.customEase,
            delay: 0.2,
            stagger: 0.15
          });
        }
      }
    );
    gsap.fromTo(
      this.closeButton,
      {
        x: 40,
        opacity: 0
      },
      {
        x: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.9
      }
    );
    this.closeButton.classList.add("active");
    // Add event listeners
    document
      .getElementById("splitLeft")
      .addEventListener("click", this.handleSplitAreaClick.bind(this));
    document
      .getElementById("splitRight")
      .addEventListener("click", this.handleSplitAreaClick.bind(this));
    document.addEventListener("keydown", this.handleZoomKeys.bind(this));
  }
  handleSplitAreaClick(e) {
    if (e.target === e.currentTarget) {
      this.exitZoomMode();
    }
  }
  exitZoomMode() {
    if (
      !this.zoomState.isActive ||
      !this.zoomState.selectedItem ||
      !this.zoomState.scalingOverlay
    )
      return;
    this.soundSystem.play("close");
    document.removeEventListener("keydown", this.handleZoomKeys);
    const splitLeft = document.getElementById("splitLeft");
    const splitRight = document.getElementById("splitRight");
    if (splitLeft)
      splitLeft.removeEventListener("click", this.handleSplitAreaClick);
    if (splitRight)
      splitRight.removeEventListener("click", this.handleSplitAreaClick);
    const splitContainer = this.splitScreenContainer;
    const selectedElement = this.zoomState.selectedItem.element;
    const selectedImg = this.zoomState.selectedItem.img;
    if (this.zoomState.flipAnimation) {
      this.zoomState.flipAnimation.kill();
    }
    // Hide title overlay quickly
    const overlayElement = this.imageTitleOverlay;
    gsap.to(overlayElement, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out"
    });
    gsap.to("#imageSlideNumber span", {
      duration: 0.4,
      y: -20,
      opacity: 0,
      ease: "power2.out"
    });
    gsap.to("#imageSlideTitle h1", {
      duration: 0.4,
      y: -60,
      opacity: 0,
      ease: "power2.out"
    });
    if (this.descriptionLines) {
      gsap.to(this.descriptionLines, {
        duration: 0.4,
        y: -80,
        opacity: 0,
        ease: "power2.out",
        stagger: -0.05,
        onComplete: () => {
          overlayElement.classList.remove("active");
          // Reset all text elements
          gsap.set("#imageSlideNumber span", {
            y: 20,
            opacity: 0
          });
          gsap.set("#imageSlideTitle h1", {
            y: 60,
            opacity: 0
          });
          gsap.set(this.descriptionLines, {
            y: 80,
            opacity: 0
          });
        }
      });
    }
    gsap.to(this.closeButton, {
      duration: 0.3,
      opacity: 0,
      x: 40,
      ease: "power2.in"
    });
    splitContainer.classList.remove("active");
    gsap.to(splitContainer, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.out"
    });
    Flip.fit(this.zoomState.scalingOverlay, selectedElement, {
      duration: 1.2,
      ease: this.customEase,
      absolute: true,
      onComplete: () => {
        gsap.set(selectedImg, {
          opacity: 1
        });
        if (this.zoomState.scalingOverlay) {
          document.body.removeChild(this.zoomState.scalingOverlay);
          this.zoomState.scalingOverlay = null;
        }
        splitContainer.classList.remove("active");
        document.body.classList.remove("zoom-mode");
        this.closeButton.classList.remove("active");
        if (this.draggable) this.draggable.enable();
        this.zoomState.isActive = false;
        this.zoomState.selectedItem = null;
        this.zoomState.flipAnimation = null;
      }
    });
    if (this.zoomState.scalingOverlay) {
      gsap.to(this.zoomState.scalingOverlay, {
        opacity: 0.4,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  }
  handleZoomKeys(e) {
    if (!this.zoomState.isActive) return;
    if (e.key === "Escape") {
      this.exitZoomMode();
    }
  }
  calculateBounds() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { scaledWidth, scaledHeight } = this.gridDimensions;
    const marginX = this.config.currentGap * this.config.currentZoom;
    const marginY = this.config.currentGap * this.config.currentZoom;
    let minX, maxX, minY, maxY;
    if (scaledWidth <= vw) {
      const centerX = (vw - scaledWidth) / 2;
      minX = maxX = centerX;
    } else {
      maxX = marginX;
      minX = vw - scaledWidth - marginX;
    }
    if (scaledHeight <= vh) {
      const centerY = (vh - scaledHeight) / 2;
      minY = maxY = centerY;
    } else {
      maxY = marginY;
      minY = vh - scaledHeight - marginY;
    }
    return {
      minX,
      maxX,
      minY,
      maxY
    };
  }
  initDraggable() {
    if (this.draggable) {
      this.draggable.kill();
    }
    this.calculateGridDimensions(this.config.currentGap);
    const bounds = this.calculateBounds();
    this.draggable = Draggable.create(this.canvasWrapper, {
      type: "x,y",
      bounds: bounds,
      edgeResistance: 0.8,
      inertia: true,
      throwProps: {
        x: {
          velocity: "auto",
          resistance: 300,
          end: (endValue) => Math.round(endValue)
        },
        y: {
          velocity: "auto",
          resistance: 300,
          end: (endValue) => Math.round(endValue)
        }
      },
      onDragStart: () => {
        document.body.classList.add("dragging");
        this.soundSystem.play("drag-start");
        this.lastValidPosition.x = this.draggable.x;
        this.lastValidPosition.y = this.draggable.y;
      },
      onDrag: () => {
        this.lastValidPosition.x = this.draggable.x;
        this.lastValidPosition.y = this.draggable.y;
      },
      onDragEnd: () => {
        document.body.classList.remove("dragging");
        this.soundSystem.play("drag-end");
      }
    })[0];
  }
  handleMouseLeave() {
    if (document.body.classList.contains("dragging")) {
      document.body.classList.remove("dragging");
      gsap.to(this.canvasWrapper, {
        duration: 0.6,
        x: this.lastValidPosition.x,
        y: this.lastValidPosition.y,
        ease: "power2.out"
      });
      if (this.draggable) {
        this.draggable.endDrag();
      }
    }
  }
  calculateFitZoom() {
    const vw = window.innerWidth;
    const vh = window.innerHeight - 80;
    const currentGap = this.calculateGapForZoom(1.0);
    const gridWidth =
      this.config.cols * (this.config.itemSize + currentGap) - currentGap;
    const gridHeight =
      this.config.rows * (this.config.itemSize + currentGap) - currentGap;
    const margin = 40;
    const availableWidth = vw - margin * 2;
    const availableHeight = vh - margin * 2;
    const zoomToFitWidth = availableWidth / gridWidth;
    const zoomToFitHeight = availableHeight / gridHeight;
    const fitZoom = Math.min(zoomToFitWidth, zoomToFitHeight);
    return Math.max(0.1, Math.min(2.0, fitZoom));
  }
  playIntroAnimation() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const screenCenterX = vw / 2;
    const screenCenterY = vh / 2;
    const canvasStyle = getComputedStyle(this.canvasWrapper);
    const canvasMatrix = new DOMMatrix(canvasStyle.transform);
    const canvasX = canvasMatrix.m41;
    const canvasY = canvasMatrix.m42;
    const canvasScale = canvasMatrix.a;
    const centerX =
      (screenCenterX - canvasX) / canvasScale - this.config.itemSize / 2;
    const centerY =
      (screenCenterY - canvasY) / canvasScale - this.config.itemSize / 2;

    // Position items at center but keep hidden
    this.gridItems.forEach((itemData, index) => {
      const zIndex = this.gridItems.length - index;
      gsap.set(itemData.element, {
        left: centerX,
        top: centerY,
        scale: 0.8,
        zIndex: zIndex,
        opacity: 0 // Keep hidden, will fade in during animation
      });
    });

    // Animate from center to grid positions with fade in
    gsap.to(
      this.gridItems.map((item) => item.element),
      {
        duration: 0.2,
        left: (index) => this.gridItems[index].baseX,
        top: (index) => this.gridItems[index].baseY,
        scale: 1,
        opacity: 1, // Add fade in
        ease: "power2.out",
        stagger: {
          amount: 1.5,
          from: "start",
          grid: [this.config.rows, this.config.cols]
        },
        onComplete: () => {
          this.gridItems.forEach((itemData) => {
            gsap.set(itemData.element, {
              zIndex: 1
            });
          });
          // Show controls with staggered animation
        }
      }
    );
  }
  autoFitZoom(buttonElement = null) {
    if (this.zoomState.isActive) {
      this.exitZoomMode();
      return;
    }
    const fitZoom = this.calculateFitZoom();
    this.config.currentZoom = fitZoom;
    const newGap = this.calculateGapForZoom(fitZoom);
    this.soundSystem.play(fitZoom < 0.6 ? "zoom-out" : "zoom-in");
    this.calculateGridDimensions(this.config.currentGap);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const currentScaledWidth =
      this.gridDimensions.width * this.config.currentZoom;
    const currentScaledHeight =
      this.gridDimensions.height * this.config.currentZoom;
    const centerX = (vw - currentScaledWidth) / 2;
    const centerY = (vh - currentScaledHeight) / 2;
    gsap.to(this.canvasWrapper, {
      duration: 0.6,
      x: centerX,
      y: centerY,
      ease: this.centerEase,
      onComplete: () => {
        if (newGap !== this.config.currentGap) {
          this.gridItems.forEach((itemData) => {
            const newX = itemData.col * (this.config.itemSize + newGap);
            const newY = itemData.row * (this.config.itemSize + newGap);
            itemData.baseX = newX;
            itemData.baseY = newY;
            gsap.to(itemData.element, {
              duration: 1.0,
              left: newX,
              top: newY,
              ease: this.customEase
            });
          });
          const newWidth =
            this.config.cols * (this.config.itemSize + newGap) - newGap;
          const newHeight =
            this.config.rows * (this.config.itemSize + newGap) - newGap;
          gsap.to(this.canvasWrapper, {
            duration: 1.0,
            width: newWidth,
            height: newHeight,
            ease: this.customEase
          });
          this.config.currentGap = newGap;
        }
        this.calculateGridDimensions(newGap);
        const finalScaledWidth = this.gridDimensions.width * fitZoom;
        const finalScaledHeight = this.gridDimensions.height * fitZoom;
        const finalCenterX = (vw - finalScaledWidth) / 2;
        const finalCenterY = (vh - finalScaledHeight) / 2;
        gsap.to(this.canvasWrapper, {
          duration: 1.2,
          scale: fitZoom,
          x: finalCenterX,
          y: finalCenterY,
          ease: this.customEase,
          onComplete: () => {
            this.lastValidPosition.x = finalCenterX;
            this.lastValidPosition.y = finalCenterY;
            this.initDraggable();
          }
        });
      }
    });
  }
  setZoom(zoomLevel, buttonElement = null) {
    if (this.zoomState.isActive) {
      this.exitZoomMode();
      return;
    }
    const newGap = this.calculateGapForZoom(zoomLevel);
    const oldZoom = this.config.currentZoom;
    this.config.currentZoom = zoomLevel;
    this.soundSystem.play(zoomLevel < oldZoom ? "zoom-out" : "zoom-in");
    this.calculateGridDimensions(this.config.currentGap);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const currentScaledWidth = this.gridDimensions.width * oldZoom;
    const currentScaledHeight = this.gridDimensions.height * oldZoom;
    const centerX = (vw - currentScaledWidth) / 2;
    const centerY = (vh - currentScaledHeight) / 2;
    gsap.to(this.canvasWrapper, {
      duration: 0.6,
      x: centerX,
      y: centerY,
      ease: this.centerEase,
      onComplete: () => {
        if (newGap !== this.config.currentGap) {
          this.gridItems.forEach((itemData) => {
            const newX = itemData.col * (this.config.itemSize + newGap);
            const newY = itemData.row * (this.config.itemSize + newGap);
            itemData.baseX = newX;
            itemData.baseY = newY;
            gsap.to(itemData.element, {
              duration: 1.2,
              left: newX,
              top: newY,
              ease: this.customEase
            });
          });
          const newWidth =
            this.config.cols * (this.config.itemSize + newGap) - newGap;
          const newHeight =
            this.config.rows * (this.config.itemSize + newGap) - newGap;
          gsap.to(this.canvasWrapper, {
            duration: 1.2,
            width: newWidth,
            height: newHeight,
            ease: this.customEase
          });
          this.config.currentGap = newGap;
        }
        this.calculateGridDimensions(newGap);
        const finalScaledWidth = this.gridDimensions.width * zoomLevel;
        const finalScaledHeight = this.gridDimensions.height * zoomLevel;
        const finalCenterX = (vw - finalScaledWidth) / 2;
        const finalCenterY = (vh - finalScaledHeight) / 2;
        gsap.to(this.canvasWrapper, {
          duration: 1.2,
          scale: zoomLevel,
          x: finalCenterX,
          y: finalCenterY,
          ease: this.customEase,
          onComplete: () => {
            this.lastValidPosition.x = finalCenterX;
            this.lastValidPosition.y = finalCenterY;
            this.calculateGridDimensions(newGap);
            this.initDraggable();
          }
        });
      }
    });
  }
  resetPosition() {
    if (this.zoomState.isActive) {
      this.exitZoomMode();
      return;
    }
    this.calculateGridDimensions(this.config.currentGap);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { scaledWidth, scaledHeight } = this.gridDimensions;
    const centerX = (vw - scaledWidth) / 2;
    const centerY = (vh - scaledHeight) / 2;
    gsap.to(this.canvasWrapper, {
      duration: 1.0,
      x: centerX,
      y: centerY,
      ease: this.centerEase,
      onComplete: () => {
        this.lastValidPosition.x = centerX;
        this.lastValidPosition.y = centerY;
        this.initDraggable();
      }
    });
  }
  init() {
    this.config.currentGap = this.calculateGapForZoom(this.config.currentZoom);
    this.generateGridItems();

    // Set initial opacity for viewport to hide the flash
    gsap.set(this.viewport, { opacity: 0 });

    gsap.set(this.canvasWrapper, {
      scale: this.config.currentZoom
    });
    this.calculateGridDimensions(this.config.currentGap);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { scaledWidth, scaledHeight } = this.gridDimensions;
    const centerX = (vw - scaledWidth) / 2;
    const centerY = (vh - scaledHeight) / 2;
    gsap.set(this.canvasWrapper, {
      x: centerX,
      y: centerY
    });
    this.lastValidPosition.x = centerX;
    this.lastValidPosition.y = centerY;
    // Setup event listeners
    this.setupEventListeners();

    // Fade in viewport, then play animations
    gsap.to(this.viewport, {
      duration: 0.6,
      opacity: 1,
      ease: "power2.inOut",
      onComplete: () => {
        this.playIntroAnimation();

        gsap.to(".header", {
          duration: 1.2,
          opacity: 1,
          ease: "power2.out",
          delay: 0.8
        });

        gsap.to(".footer", {
          duration: 1.4,
          opacity: 1,
          ease: "power2.out",
          delay: 1
        });

        setTimeout(() => {
          this.initDraggable();
          this.setupViewportObserver();
        }, 1500);
      }
    });
  }
  setupEventListeners() {
    window.addEventListener("resize", () => {
      setTimeout(() => {
        this.resetPosition();
        this.initDraggable();
      }, 100);
    });
    document.addEventListener("mouseleave", () => this.handleMouseLeave());
    this.viewport.addEventListener("mouseleave", () => this.handleMouseLeave());
    this.closeButton.addEventListener("click", () => this.exitZoomMode());
  }
}
function setupMenuAndModal() {
  const menuSection = document.querySelector(".menu-section");
  const menuToggle = document.getElementById("menuToggle");
  const menuDrawer = document.getElementById("menuDrawer");
  if (!menuSection || !menuToggle || !menuDrawer) return;

  const closeMenu = () => {
    menuSection.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    menuSection.classList.add("open");
    menuToggle.setAttribute("aria-expanded", "true");
  };

  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menuSection.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!menuSection.contains(event.target)) {
      closeMenu();
    }
  });

  menuDrawer.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link) {
      closeMenu();
    }
  });

  const openModals = new Set();

  const closeModal = (modal) => {
    if (!modal || !openModals.has(modal)) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    openModals.delete(modal);
    if (openModals.size === 0) {
      document.body.classList.remove("modal-open");
    }
  };

  const openModal = (modal) => {
    if (!modal) return;
    closeMenu();
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    openModals.add(modal);
    const focusTarget = modal.querySelector("[data-close-modal]");
    focusTarget?.focus({ preventScroll: true });
  };

  const modalTriggers = document.querySelectorAll("[data-open-modal]");
  const processedModals = new Set();
  modalTriggers.forEach((trigger) => {
    const modalId = trigger.getAttribute("data-open-modal");
    if (!modalId) return;
    const modal = document.getElementById(modalId);
    if (!modal) return;
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(modal);
    });
    if (!processedModals.has(modal)) {
      const closeElements = modal.querySelectorAll("[data-close-modal]");
      closeElements.forEach((el) => {
        el.addEventListener("click", () => closeModal(modal));
      });
      processedModals.add(modal);
    }
  });

  const closeAllModals = () => {
    openModals.forEach((modal) => {
      closeModal(modal);
    });
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
      closeMenu();
    }
  });
}
// Initialize gallery with preloader
let gallery;
document.addEventListener("DOMContentLoaded", () => {
  setupMenuAndModal();
  const preloader = new PreloaderManager();

  // Wait for preloader to complete, then initialize gallery
  setTimeout(() => {
    preloader.complete(() => {
      // Initialize gallery after preloader fades out
      gallery = new FashionGallery();
      gallery.init();
    });
  }, 2000); // 2 seconds preloader duration
});
