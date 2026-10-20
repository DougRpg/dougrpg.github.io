/* DougRPG — interações do site (JavaScript puro, sem dependências). */
(() => {
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* Ano atual no rodapé */
	document.querySelectorAll('[data-year]').forEach((el) => {
		el.textContent = new Date().getFullYear();
	});

	/* Caixa de diálogo de RPG: o texto aparece letra por letra.
	   Clicar na caixa mostra o texto inteiro de uma vez. */
	document.querySelectorAll('[data-typewriter]').forEach((el) => {
		const text = el.textContent.trim().replace(/\s+/g, ' ');
		const box = el.closest('.dialog') || el;
		if (reduceMotion || !text) return;

		const full = document.createElement('span'); // texto completo, para leitores de tela
		const ghost = document.createElement('span'); // reserva o tamanho final da caixa
		const live = document.createElement('span'); // texto sendo "digitado"
		full.className = 'sr-only';
		ghost.className = 'tw-ghost';
		live.className = 'tw-live';
		full.textContent = text;
		ghost.textContent = text;
		ghost.setAttribute('aria-hidden', 'true');
		live.setAttribute('aria-hidden', 'true');
		el.replaceChildren(full, ghost, live);
		box.classList.add('is-typing');

		let i = -12; // pequena pausa antes de começar
		let done = false;
		const finish = () => {
			if (done) return;
			done = true;
			clearInterval(timer);
			live.textContent = text;
			box.classList.remove('is-typing');
		};
		const timer = setInterval(() => {
			i += 1;
			live.textContent = text.slice(0, Math.max(0, i));
			if (i >= text.length) finish();
		}, Math.max(15, Math.min(35, 2500 / text.length)));
		box.addEventListener('click', finish);
	});

	/* Galeria: abre as screenshots ampliadas.
	   Teclado: setas para navegar, Esc para fechar. */
	const shots = [...document.querySelectorAll('[data-lightbox]')];

	if (shots.length && typeof HTMLDialogElement === 'function') {
		const dialog = document.createElement('dialog');
		dialog.className = 'lightbox';
		dialog.setAttribute('aria-label', 'Visualizador de imagens');
		dialog.innerHTML = `
			<figure class="lightbox__figure">
				<img class="lightbox__img" alt="">
				<figcaption class="lightbox__caption"></figcaption>
			</figure>
			<button type="button" class="lightbox__btn lightbox__close" aria-label="Fechar">X</button>
			<button type="button" class="lightbox__btn lightbox__prev" aria-label="Imagem anterior"></button>
			<button type="button" class="lightbox__btn lightbox__next" aria-label="Próxima imagem"></button>`;
		document.body.append(dialog);

		const img = dialog.querySelector('.lightbox__img');
		const caption = dialog.querySelector('.lightbox__caption');
		let current = 0;

		// Amplia o máximo que couber na tela; pixel art usa escala inteira (2x, 3x...) para ficar nítida
		const fit = () => {
			if (!img.naturalWidth) return;
			const small = window.innerWidth < 720;
			const maxW = window.innerWidth - (small ? 32 : 180);
			const maxH = window.innerHeight - (small ? 180 : 140);
			let scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
			if (scale >= 2 && img.classList.contains('pixel')) scale = Math.floor(scale);
			img.style.width = `${Math.round(img.naturalWidth * scale)}px`;
			img.style.height = `${Math.round(img.naturalHeight * scale)}px`;
		};

		const show = (index) => {
			current = (index + shots.length) % shots.length;
			const link = shots[current];
			const thumb = link.querySelector('img');
			img.classList.toggle('pixel', Boolean(thumb && thumb.classList.contains('pixel')));
			img.alt = thumb ? thumb.alt : '';
			img.src = link.href;
			caption.textContent = `${current + 1} / ${shots.length}`;
			if (img.complete) fit();
		};

		img.addEventListener('load', fit);
		window.addEventListener('resize', () => {
			if (dialog.open) fit();
		});

		shots.forEach((link, index) => {
			link.addEventListener('click', (event) => {
				event.preventDefault();
				show(index);
				dialog.showModal();
			});
		});

		dialog.querySelector('.lightbox__close').addEventListener('click', () => dialog.close());
		dialog.querySelector('.lightbox__prev').addEventListener('click', () => show(current - 1));
		dialog.querySelector('.lightbox__next').addEventListener('click', () => show(current + 1));
		dialog.addEventListener('click', (event) => {
			if (event.target === dialog) dialog.close(); // clique fora da imagem
		});
		dialog.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowLeft') show(current - 1);
			if (event.key === 'ArrowRight') show(current + 1);
		});
		dialog.addEventListener('close', () => shots[current].focus());
	}

	/* Índice da página: destaca a seção que está sendo lida */
	const toc = document.querySelector('.toc');

	if (toc && 'IntersectionObserver' in window) {
		const links = new Map(
			[...toc.querySelectorAll('a[href^="#"]')].map((a) => [decodeURIComponent(a.hash.slice(1)), a])
		);
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				links.forEach((a) => a.removeAttribute('aria-current'));
				const link = links.get(entry.target.id);
				if (link) link.setAttribute('aria-current', 'location');
			});
		}, { rootMargin: '-20% 0px -70% 0px' });

		links.forEach((_, id) => {
			const section = document.getElementById(id);
			if (section) observer.observe(section);
		});
	}
})();
