// courses.js — study material DERIVED from video instructionals the owner studies.
//
// PROVENANCE / COPYRIGHT: these are original notes — paraphrased summaries, frameworks,
//   flashcards and quiz questions written from a local transcript (whisper.cpp small.en) and
//   scene frames of the owner's own purchased copy. NO transcript text, frames, or video are
//   published: media lives in ./media/ (git-ignored). Timestamps let the owner scrub their copy.
// PIPELINE (2026-10-10): ffmpeg → 16 kHz wav → whisper-cli -osrt → read with timestamps;
//   ffmpeg scene-change frames → contact sheets → visual check of demos.
// TRANSCRIPT CORRECTIONS: "kinkyotsu/iotsu" = kenka-yotsu/ai-yotsu; "shizun type" = shizen-tai;
//   "jigo tile" = jigo-tai; "kazushi" = kuzushi; "Tom and I"/"Toyinage" read as tomoe-nage
//   (inferred from context — flagged `uncertain` where shown).
// SCHEMA: course { id, title, instructor, publisher, missing, lessons[] };
//   lesson { id, n, title, dur, summary, points[[mm:ss, text]], frameworks[{title, items[]}],
//   techniques[{id, note, uncertain?}] (ids from data.js), cards[[q, a]], quiz[[q, choices[], correctIdx]] }.
//   Card ids are `${lesson.id}:c${i}` so they share the technique SRS store.

export const CONCEPTS = [
  ['Ai-yotsu', '相四つ', 'Same-side stance relationship: both right foot forward, or both left.'],
  ['Kenka-yotsu', '喧嘩四つ', 'Opposite-side stance relationship: one righty, one lefty. Literally "fighting grip".'],
  ['Shizen-tai', '自然体', 'Upright natural posture — maximum mobility; use it to move to your preferred spot on the mat.'],
  ['Jigo-tai', '自護体', 'Defensive crouch — stops jumping guard pulls, but costs mobility and grip-fighting and exposes the back to snap-downs.'],
  ['Semi-crouch', '', 'Danaher\'s preferred all-round stance: protects the legs, lets you grip fight, keeps adequate mobility.'],
  ['Step distance', '', 'Range where the opponent must take a step to touch you — lets you engage on your terms.'],
  ['Power hand', '', 'The opponent\'s dominant (usually lapel/collar) hand — controls your head, and so your balance.'],
  ['Pyramid position', '', 'Apex of a triangle drawn out from the line joining uke\'s ankles; push/pull perpendicular to that line and balance breaks easily.'],
  ['Outside flank', '', 'Position to the side of the opponent; with the pyramid, one of the two places you move toward once gripped.'],
  ['Roll-through', '', 'You complete a throw but momentum carries you over and you land underneath — scores nothing in BJJ.'],
  ['Dropping throw', '', 'A throw finished from the knees/low; lowers your centre of gravity so you are hard to roll through.'],
];

const FTF1_LESSONS = [
  {
    id: 'ftf1-01', n: 1, title: 'Introduction to Feet to Floor, Volume 1', dur: '4:20',
    summary: 'Volume 1 builds the precursor skills that make takedowns possible and lays out a first takedown curriculum chosen for jiu-jitsu\'s rules — not wrestling\'s, judo\'s or sambo\'s. The target: score standing against people your own size and skill within 3–6 months, starting with hand-based takedowns because hands learn faster than feet.',
    points: [
      ['00:25', 'Five precursor skills: stance, grip, motion, kuzushi (off-balancing), position. They never make the highlight reel but make everything on it possible.'],
      ['00:58', 'Rules and directives in BJJ differ from related arts — a takedown that is great in judo can be a liability in BJJ.'],
      ['01:22', 'Goal: score in standing within 3–6 months against same size/skill. Prefer techniques that overlap with what BJJ players already do on the ground.'],
      ['01:53', 'Hand-based takedowns first; leg-dominant throws (longer learning, more power) come later in the series.'],
      ['02:36', 'Front takedowns vs rear takedowns (from behind, into prone positions). Rear takedowns score in BJJ though not in many other arts — study them.'],
      ['02:56', 'In sport BJJ takedowns are optional; in self-defense they are a necessity — step one of the classic four-step system.'],
    ],
    frameworks: [
      { title: 'The five precursor skills', items: ['Stance', 'Grip', 'Motion', 'Kuzushi — off-balancing', 'Position'] },
      { title: 'What Volume 1 delivers', items: ['The precursor skills', 'A front + rear takedown curriculum for sport BJJ (3–6 months to usable)', 'Takedowns for self-defense'] },
    ],
    techniques: [],
    cards: [
      ['Name the five precursor skills of the standing position.', 'Stance, grip, motion, kuzushi (off-balancing), position.'],
      ['Why does Volume 1 start with hand-based takedowns?', 'Hands are far more dexterous than feet, so hand skills are learned much faster — the goal is scoring within 3–6 months.'],
      ['Front vs rear takedowns — why do rear takedowns matter in BJJ?', 'They score in BJJ (unlike many grappling arts), so they must be a real area of study.'],
      ['Takedowns in sport BJJ vs self-defense?', 'Sport: a choice (you can be world champion without them). Self-defense: a necessity — the first step of the four-step system.'],
    ],
    quiz: [
      ['What is the stated timeline for scoring standing against equals?', ['3–6 months', '1–2 years', '4 weeks', '5 years'], 0],
      ['Which is NOT one of the five precursor skills?', ['Guard pulling', 'Stance', 'Motion', 'Position'], 0],
      ['Which body part is prioritised for the first takedowns?', ['The hands', 'The feet', 'The hips', 'The head'], 0],
    ],
  },
  {
    id: 'ftf1-02', n: 2, title: 'The Six Essential Skills of Jiu-Jitsu in the Standing Position', dur: '7:15',
    summary: 'The standing game in BJJ is six distinct skills. The series will cover all six; Volume 1 concentrates on the five precursor skills underneath them so the six come faster.',
    points: [
      ['00:42', 'Skill 1 — takedowns from in front: matches start face to face; you can take the opponent forward or backward.'],
      ['01:45', 'Skill 2 — takedowns from behind, again forward or backward. Holding a knee down for 3 seconds scores 2, same as a front takedown.'],
      ['02:42', 'Skill 3 — guard pulling. Done actively it can score points; done passively it just gets the fight down. Active pulls get the attention.'],
      ['04:12', 'Skill 4 — countering the guard pull, e.g. pushing the leg down and passing straight off the grips.'],
      ['04:38', 'Skill 5 — stopping/countering takedowns, e.g. vs a single leg the belt is often available to turn them over into a pin.'],
      ['05:11', 'Skill 6 — standing entries into submissions: leg locks, arm locks, strangles straight from a grip.'],
      ['06:50', 'Volume 1 focus: stance, grip, motion, breaking balance, throwing position.'],
    ],
    frameworks: [
      { title: 'The six standing skills', items: ['Takedowns from the front', 'Takedowns from behind', 'Guard pulling (ideally aggressive, point-scoring)', 'Countering the guard pull', 'Stopping / countering takedowns', 'Standing entries into submissions'] },
    ],
    techniques: [],
    cards: [
      ['List the six essential standing skills of BJJ.', 'Front takedowns · rear takedowns · guard pulling · countering guard pulls · stopping/countering takedowns · standing entries to submissions.'],
      ['How does a rear takedown score?', 'Keep a knee (or hip) on the mat for 3 seconds → 2 points, same as a front takedown.'],
      ['Active vs passive guard pulling?', 'Active pulls create scoring chances (e.g. off a forward reaction); passive pulls just take the fight down. The series emphasises active pulls.'],
      ['Example of countering a guard pull?', 'As they pull, push the leg down and pass directly off the grips.'],
    ],
    quiz: [
      ['Which is one of the six standing skills?', ['Countering the guard pull', 'Escaping mount', 'Guard retention', 'Back control'], 0],
      ['How long must a knee be held down after a rear takedown to score?', ['3 seconds', '1 second', '5 seconds', '10 seconds'], 0],
      ['What does Volume 1 mainly focus on?', ['The precursor skills', 'Standing leg locks', 'Passive guard pulling', 'Self-defense only'], 0],
    ],
  },
  {
    id: 'ftf1-03', n: 3, title: 'The Criteria for Takedown Selection for Jiu-Jitsu', dur: '28:40',
    summary: 'Six criteria grade any takedown for BJJ. The first five measure risk under BJJ rules — the referee never rescues you, a back take scores 4 (double a takedown) and a takedown only scores with 3 seconds of control. The sixth measures learning time. Low-amplitude, chest-facing, dropping takedowns (ankle pick, collar drag, drop tai-otoshi) score best early; the great standing throws are long-term projects.',
    points: [
      ['00:37', 'Criterion 1 — back exposure. A failed seoi-nage can hand over the back: 0 for you, 4 for them, and in BJJ no referee steps in.'],
      ['02:08', 'Back exposure comes in degrees: drop ippon-seoi-nage (max, inside the legs) > drop tai-otoshi (drop outside the legs) > drop kata-guruma (half turn) > chest-facing takedowns like the ankle pick (none).'],
      ['05:00', 'Criterion 2 — neck exposure. Single legs invite strangles; double legs run into guillotines. While they hold the guillotine you cannot score — you must free the head and hold 3 seconds.'],
      ['07:01', 'Zero-neck-exposure takedowns: tomoe-nage-style foot/hip throws, and the ankle pick because your upper-body grip blocks head control.'],
      ['08:23', 'Criterion 3 — belt exposure. The belt sits at your centre of gravity; a belt grip puts you on toes or heels for uchi-mata or sumi-gaeshi counters. Single legs expose it; the collar drag never does.'],
      ['10:53', 'Criterion 4 — weight exposure. If a single/double leg stalls, a sprawl leaves you under their body weight. A missed ankle pick never puts you underneath.'],
      ['13:36', 'Criterion 5 — roll-through. BJJ needs 3 s of control: back, side or buttocks down from the front; a knee or hip down from behind.'],
      ['16:09', 'A committed competition o-goshi (single-hip, sprint stance) wins in judo but often rolls you underneath in BJJ.'],
      ['18:56', 'Favour dropping throws — drop tai-otoshi, drop o-soto-gari — and low-amplitude takedowns like the ankle pick: low centre of gravity, little roll-through.'],
      ['21:25', 'Criterion 6 — difficulty. Turning against stiff arms and balancing on one leg (hopping) make a throw slow to learn: o-soto-gari, tai-otoshi, hopping uchi-mata, harai-goshi.'],
      ['25:51', 'Ankle pick and collar drag can be taught to scoring level quickly. Standing time is time taken from the ground, where most BJJ points are won.'],
    ],
    frameworks: [
      { title: 'Six takedown-selection criteria', items: ['Back exposure', 'Neck exposure', 'Belt exposure', 'Weight exposure', 'Roll-through exposure', 'Degree of difficulty (learning time)'] },
      { title: 'Back exposure, worst → best', items: ['Drop ippon-seoi-nage (drop between the legs)', 'Drop tai-otoshi (drop outside the legs)', 'Drop kata-guruma (half turn)', 'Chest-facing takedowns, e.g. ankle pick (none)'] },
      { title: 'What makes a throw hard to learn', items: ['Turning (up to 180°) against locked-out, resisting arms', 'Standing/hopping on one leg (small base of support)'] },
      { title: 'BJJ scoring facts behind the criteria', items: ['Back take = 4 points; takedown = 2', 'Takedown scores only with 3 s control (back/side/buttocks; or knee/hip from behind)', 'No referee intervention after a failed throw', 'A held guillotine blocks the takedown score'] },
    ],
    techniques: [
      { id: 'seoi-nage', note: 'Beautiful but long-term — maximum back exposure if it fails.' },
      { id: 'ippon-seoi-nage', note: 'Drop version = the most back exposure of all (drop between the legs).' },
      { id: 'tai-otoshi', note: 'Drop version is favoured: less back exposure, low centre of gravity, hard to roll through. Standing version is hard vs stiff arms.' },
      { id: 'kata-guruma', note: 'Drop version: half turn, half the back exposed.' },
      { id: 'o-goshi', note: 'Textbook o-goshi rarely works live; competition single-hip version invites roll-through.' },
      { id: 'o-soto-gari', note: 'Standing/hopping versions are hard to learn; the drop o-soto-gari is preferred.' },
      { id: 'uchi-mata', note: 'Threat from a belt grip; hopping (kenken) uchi-mata is a long-term skill.' },
      { id: 'harai-goshi', note: 'Long-term project in BJJ.' },
      { id: 'sumi-gaeshi', note: 'A counter that belt exposure invites.' },
      { id: 'tomoe-nage', note: 'Example of zero neck exposure.', uncertain: true },
      { id: 'kibisu-gaeshi', note: 'Closest Kodokan analogue of the BJJ ankle pick — scores well on every criterion.' },
      { id: 'kuchiki-taoshi', note: 'Closest analogue of the single leg: exposes neck, belt and weight.' },
      { id: 'morote-gari', note: 'Closest analogue of the double leg: guillotine and sprawl risk.' },
    ],
    cards: [
      ['Name the six takedown-selection criteria.', 'Back exposure, neck exposure, belt exposure, weight exposure, roll-through exposure, degree of difficulty.'],
      ['Why is back exposure worse in BJJ than in judo?', 'The referee never intervenes, and a back take scores 4 — twice a takedown.'],
      ['Rank by back exposure: drop tai-otoshi, ankle pick, drop ippon-seoi-nage, drop kata-guruma.', 'Drop ippon-seoi-nage > drop tai-otoshi > drop kata-guruma > ankle pick (none).'],
      ['What is "belt exposure" and why does it matter?', 'Giving the opponent your belt = giving them your centre of gravity; they can put you on toes/heels and counter with uchi-mata or sumi-gaeshi.'],
      ['Why does the ankle pick avoid weight exposure?', 'If it fails you are never underneath them — they can sprawl all they like.'],
      ['What are the BJJ control requirements for a takedown to score?', '3 seconds with them on back, side or buttocks; from behind, a knee or hip held down 3 seconds.'],
      ['How do you reduce roll-through risk?', 'Lower the amplitude and your centre of gravity — dropping throws (drop tai-otoshi, drop o-soto-gari) and low takedowns like the ankle pick.'],
      ['What two things make a throw intrinsically hard to learn?', 'Turning against resisting stiff arms, and balancing/hopping on one leg.'],
      ['Which two takedowns are named as quick to learn to scoring level?', 'The ankle pick and the collar drag.'],
    ],
    quiz: [
      ['A double leg most risks which of these?', ['Guillotine & sprawl', 'Back exposure', 'Roll-through', 'Nothing'], 0],
      ['Which takedown never exposes your belt?', ['Collar drag', 'Single leg', 'Double leg', 'Hopping o-soto-gari'], 0],
      ['Which has the MOST back exposure?', ['Drop ippon-seoi-nage', 'Drop tai-otoshi', 'Drop kata-guruma', 'Ankle pick'], 0],
      ['Why is the competition o-goshi risky in BJJ?', ['Its momentum often rolls you through to bottom', 'It is illegal', 'It exposes your neck', 'It scores only 1 point'], 0],
      ['Which criterion is about learning time?', ['Degree of difficulty', 'Weight exposure', 'Belt exposure', 'Neck exposure'], 0],
    ],
  },
  {
    id: 'ftf1-04', n: 4, title: 'Creating an Overall Game Plan in the Standing Position', dur: '20:20',
    summary: 'A minute-by-minute standing game plan, so you always know what to do on the feet as clearly as you do on the ground: prepare the gi, pick a stance and a spot on the mat, fight at step distance, read ai-yotsu vs kenka-yotsu, win the grip hierarchy (or lower expectations), then create motion and break balance with the feet.',
    points: [
      ['00:26', 'Most BJJ players know exactly what to do on the ground but are lost standing — which is why so many just pull guard.'],
      ['02:42', 'Prepare the gi: arms overhead then back in to shorten the sleeves (less to grab). Hands guard the lapels, not the jaw.'],
      ['03:21', 'Three stances: shizen-tai (upright, mobile), semi-crouch (best all-round), jigo-tai (defensive crouch).'],
      ['03:55', 'Choose your mat location: near the edge if you fear takedowns (run out of bounds), open space if you drive double legs. Danaher prefers the centre.'],
      ['04:57', 'Step distance: they must step to touch you, so you can step away and engage on your terms — no easy guard pulls.'],
      ['06:00', 'Jigo-tai shuts down flying guard pulls but costs mobility and grip fighting, and exposes the back to snap-downs.'],
      ['07:28', 'Read the opponent: same side forward = ai-yotsu, opposite = kenka-yotsu. Everything after depends on it.'],
      ['08:44', 'Grip supremacy: kill their power hand and assert yours — two hands on them, none on you. Then throws come easily.'],
      ['10:26', 'Grip advantage: chin over the top and work their hand lower on your chest; work your own hand higher than theirs.'],
      ['11:52', 'Out-gripped? Lower your expectations: the outside grip on their arm can never be denied. Switch stance; you control the shoulders.'],
      ['13:20', 'From the inferior grip, big head-control throws (uchi-mata, harai-goshi, tai-otoshi) are hard — but sacrifice throws, guard pulls and pulls into submissions still work.'],
      ['17:48', 'Once gripped, create motion — toward the outside flank, then the top of the pyramid.'],
      ['18:29', 'Break balance with the feet (ashi-waza actions) — trips and steps make them stumble, then throws start to work.'],
    ],
    frameworks: [
      { title: 'The standing game plan, in order', items: ['Prepare the gi & defend the lapels', 'Natural stance → preferred mat location', 'Step distance + semi-crouch', 'Read: ai-yotsu or kenka-yotsu', 'Win the grip hierarchy', 'Create motion → outside flank / pyramid', 'Kuzushi with the feet → throw'] },
      { title: 'Three stances', items: ['Shizen-tai — upright, mobile', 'Semi-crouch — best all-round', 'Jigo-tai — defensive, anti-guard-pull, costly'] },
      { title: 'Grip hierarchy', items: ['Supremacy — your hands on them, theirs off you', 'Advantage — their power hand low, yours high', 'Inferiority — lower expectations: outside grip, sacrifice throws, guard pulls, submissions'] },
    ],
    techniques: [
      { id: 'uchi-mata', note: 'Needs head control — hard from an inferior grip.' },
      { id: 'harai-goshi', note: 'Needs head control — hard from an inferior grip.' },
      { id: 'tai-otoshi', note: 'Hard from the outside grip without specialised (spinning) variations.' },
      { id: 'tomoe-nage', note: 'Workable from the outside grip when out-gripped.', uncertain: true },
      { id: 'de-ashi-harai', note: 'Example family of foot actions used purely to break balance.' },
    ],
    cards: [
      ['How do you prepare the gi at the start?', 'Raise the arms overhead and bring them back in to shorten the sleeves; hands then guard the lapels.'],
      ['Three stances and what each is for?', 'Shizen-tai: mobility / reach your spot. Semi-crouch: all-round grip fighting. Jigo-tai: stop flying guard pulls (at a cost).'],
      ['Costs of jigo-tai?', 'Less mobility, weaker grip fighting, shoulders/back exposed to snap-downs.'],
      ['What is step distance?', 'The opponent must take a step to touch you, so you can step away and engage on your terms.'],
      ['Grip supremacy?', 'You have hands on them and they have none on you — mainly by neutralising their power hand.'],
      ['Grip advantage — what do you do?', 'Chin over the top, push their power hand lower on your chest; work your own hand higher than theirs.'],
      ['When out-gripped, what grip can never be denied?', 'The outside grip on their arm (switch to opposite stance).'],
      ['Which attacks still work from an inferior grip?', 'Sacrifice throws (sutemi-waza), guard pulls, pulls into submissions.'],
      ['After gripping, where do you move?', 'Create motion toward the outside flank and the top of the pyramid.'],
    ],
    quiz: [
      ['What should your hands protect when you first face off?', ['Your lapels', 'Your jaw', 'Your belt', 'Your knees'], 0],
      ['If your main move is a driving double leg, you prefer…', ['Open space behind the opponent', 'Fighting near the edge', 'Jigo-tai', 'Kenka-yotsu only'], 0],
      ['Which stance best stops a flying guard pull?', ['Jigo-tai', 'Shizen-tai', 'Semi-crouch', 'Sprint stance'], 0],
      ['With an inferior grip, which is still very workable?', ['Sacrifice throws', 'Uchi-mata', 'Harai-goshi', 'Standing tai-otoshi'], 0],
    ],
  },
  {
    id: 'ftf1-06', n: 6, title: 'The Most Important Insight in the Standing Position: Left & Right Stances', dur: '12:35',
    summary: 'What matters is not your stance but the relationship between both stances: ai-yotsu (same foot forward) or kenka-yotsu (opposite). It decides how you grip, how far you must turn, and which way you walk to reach the pyramid position from which upper-body throws work.',
    points: [
      ['00:53', 'Right-handed stance = right hip, leg, shoulder and arm forward. Four combinations exist.'],
      ['01:38', 'The Japanese terms name the relationship between two people — two people fight, not one.'],
      ['02:29', 'Ai-yotsu: same foot forward (R–R or L–L). Kenka-yotsu: opposite (R–L), even if both switch.'],
      ['03:34', 'Ai-yotsu closes the lead hips; kenka-yotsu leaves a large open area in front — grip and throw selection change completely.'],
      ['04:16', 'The pyramid position: apex of a triangle out from the line joining uke\'s ankles. Push or pull perpendicular to that line and balance goes with a finger.'],
      ['05:16', 'People stand bladed as a compromise — a squared stance falls to the smallest push or pull.'],
      ['05:41', 'Ai-yotsu: their lead leg blocks a direct throw; you must move backward/around to reach the pyramid. Kenka-yotsu: the pyramid is in front — walk forward.'],
      ['06:47', 'Ai-yotsu stiff arm feels like a steel rod and needs a big turn; in kenka-yotsu you can pull wrist-to-wrist and the turn is minimal.'],
      ['07:53', 'First question on every engagement: is this ai-yotsu or kenka-yotsu? Then program the matching grip fight.'],
      ['10:49', 'Routine: semi-crouch, move to centre, play the distance game, read the stance, then engage.'],
    ],
    frameworks: [
      { title: 'Four stance combinations', items: ['Right vs right — ai-yotsu', 'Left vs left — ai-yotsu', 'Right vs left — kenka-yotsu', 'Left vs right — kenka-yotsu'] },
      { title: 'Ai-yotsu vs kenka-yotsu', items: ['Ai-yotsu: hips closed · stiff arm is a steel rod · big turn · move back/around to the pyramid', 'Kenka-yotsu: open space · pull wrist-to-wrist · minimal turn · walk forward to the pyramid'] },
    ],
    techniques: [],
    cards: [
      ['Ai-yotsu vs kenka-yotsu?', 'Ai-yotsu: same foot forward (R–R, L–L). Kenka-yotsu: opposite feet forward (R–L).'],
      ['If you are both righty and both switch to lefty, which relationship?', 'Still ai-yotsu — it describes the relationship, not the individual stance.'],
      ['What is the pyramid position?', 'The apex of a triangle out from the line joining the opponent\'s ankles; forces perpendicular to that line break balance easily.'],
      ['Why do fighters stand bladed?', 'It\'s a compromise: the back leg resists pushes and a step absorbs pulls, unlike a squared stance.'],
      ['How do you reach the pyramid in ai-yotsu vs kenka-yotsu?', 'Ai-yotsu: move backward/around (their lead leg blocks). Kenka-yotsu: walk forward — it\'s in front of you.'],
      ['What is the first read when you face an opponent?', 'Is this ai-yotsu or kenka-yotsu? — it determines the whole grip fight.'],
    ],
    quiz: [
      ['You are right foot forward, they are left foot forward. This is…', ['Kenka-yotsu', 'Ai-yotsu', 'Jigo-tai', 'Shizen-tai'], 0],
      ['In which relationship is the turn into a throw minimal?', ['Kenka-yotsu', 'Ai-yotsu', 'Both equal', 'Neither'], 0],
      ['Balance breaks most easily when you push or pull…', ['Perpendicular to the line joining their ankles', 'Along the line of their ankles', 'Straight down', 'Toward their lead foot'], 0],
    ],
  },
];

export const COURSES = [
  {
    id: 'ftf1', title: 'Feet to Floor, Volume 1', instructor: 'John Danaher', publisher: 'BJJ Fanatics',
    blurb: 'Takedowns for jiu-jitsu: the precursor skills and how to choose takedowns that suit BJJ\'s rules.',
    missing: ['Lesson 5 — not yet processed'],
    lessons: FTF1_LESSONS,
  },
];
