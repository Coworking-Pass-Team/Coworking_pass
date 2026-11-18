Deck.start(function (B) {
  const card = document.querySelector('#test');
  const state = Particles.state;
  card.hidden = false;
  gsap.set(card, {autoAlpha:0, x:-24});
  gsap.set(state, {focus:0});
  B.scene('Start');
  B.beat('Quiet opening', 'Let the map drift. Press Next once to test your clicker.\n\nاترك الخريطة تتحرك بهدوء، ثم اضغط زر التقدم مرة واحدة لاختبار جهاز التحكم.');
  B.scene('Test');
  const start = B.t();
  B.timeline.to(state, {focus:1, duration:1.2, ease:'power2.inOut'}, start)
    .to(card, {autoAlpha:1, x:0, duration:.75}, start+.35);
  B.beat('Test', 'Press Back to restore the quiet opening. Try B to blank the display, then Next to restore it. Press P to check the presenter window.\n\nاضغط زر الرجوع للعودة إلى البداية. اضغط B لتعتيم الشاشة، ثم زر التقدم لإعادة الصورة. اضغط P لفتح شاشة المقدّم.');
});
