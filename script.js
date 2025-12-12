const app = {
    state: {
        currentTopicIndex: null,
        currentSubTopicIndex: null,
        game: {
            score: 0,
            questionCount: 0,
            currentWord: null,
            isGameActive: false,
            maxQuestions: 10
        }
    },

    // Initialize the application
    init: function () {
        this.renderHome();
    },

    // Navigation Helper
    showSection: function (sectionId) {
        document.getElementById('home-view').style.display = 'none';
        document.getElementById('topic-view').style.display = 'none';
        document.getElementById('game-view').style.display = 'none';
        document.getElementById(sectionId).style.display = 'block';

        // Update Nav
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        if (sectionId === 'home-view') document.getElementById('nav-home').classList.add('active');
        if (sectionId === 'game-view') document.getElementById('nav-game').classList.add('active');

        // Scroll to top
        window.scrollTo(0, 0);
    },

    // Render Home View
    renderHome: function () {
        this.showSection('home-view');
        const grid = document.getElementById('topic-grid');
        grid.innerHTML = '';

        // Ensure data is loaded
        if (typeof toeic600 === 'undefined') {
            grid.innerHTML = '<p style="color: red; text-align: center;">Lỗi: Không tìm thấy dữ liệu (data.js chưa được tải).</p>';
            return;
        }

        // Search Reset
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').style.display = 'none';
        grid.style.display = 'grid';

        // Loop through 10 main groups
        toeic600.forEach((group, groupIndex) => {
            // Create Group Title
            const groupTitle = document.createElement('h3');
            groupTitle.className = 'topic-group-title';
            groupTitle.textContent = group.topic_group;
            grid.appendChild(groupTitle);

            // Loop through sub-topics
            group.sub_topics.forEach((topic, subIndex) => {
                const card = document.createElement('div');
                card.className = 'topic-card fade-in';
                card.onclick = () => app.renderTopic(groupIndex, subIndex);

                card.innerHTML = `
                    <div class="topic-title">${topic.title}</div>
                    <div class="topic-meta">${topic.words.length} từ vựng</div>
                `;
                grid.appendChild(card);
            });
        });
    },

    // Render Topic Detail View
    renderTopic: function (groupIndex, subIndex) {
        this.state.currentTopicIndex = groupIndex;
        this.state.currentSubTopicIndex = subIndex;

        const topic = toeic600[groupIndex].sub_topics[subIndex];

        this.showSection('topic-view');

        document.getElementById('current-topic-title').textContent = topic.title;
        const grid = document.getElementById('word-grid');
        grid.innerHTML = '';

        topic.words.forEach((word, index) => {
            const card = this.createWordCard(word, index);
            grid.appendChild(card);
        });
    },

    // Helper to create word card
    createWordCard: function (word, index) {
        const div = document.createElement('div');
        div.className = 'word-card fade-in';
        div.style.animationDelay = `${index * 0.05}s`;

        div.innerHTML = `
            <div class="word-term">${word.word}</div>
            <div class="word-phonetic">${word.phonetic}</div>
            <div class="word-meaning">${word.meaning}</div>
        `;
        return div;
    },

    // Search Functionality
    handleSearch: function (keyword) {
        const grid = document.getElementById('topic-grid');
        const resultsContainer = document.getElementById('search-results');

        keyword = keyword.trim().toLowerCase();

        if (keyword.length === 0) {
            grid.style.display = 'grid';
            resultsContainer.style.display = 'none';
            return;
        }

        grid.style.display = 'none';
        resultsContainer.style.display = 'grid';
        resultsContainer.innerHTML = '';

        let count = 0;
        toeic600.forEach(group => {
            group.sub_topics.forEach(topic => {
                topic.words.forEach(word => {
                    if (word.word.toLowerCase().includes(keyword) ||
                        word.meaning.toLowerCase().includes(keyword)) {

                        const card = this.createWordCard(word, 0);
                        // Add topic info to card
                        const meta = document.createElement('div');
                        meta.className = 'topic-meta';
                        meta.style.marginTop = '0.5rem';
                        meta.style.fontSize = '0.75rem';
                        meta.textContent = `In: ${topic.title}`;
                        card.appendChild(meta);

                        resultsContainer.appendChild(card);
                        count++;
                    }
                });
            });
        });

        if (count === 0) {
            resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Không tìm thấy từ nào.</p>';
        }
    },

    // Game Logic
    getAllWords: function () {
        let allWords = [];
        toeic600.forEach(group => {
            group.sub_topics.forEach(topic => {
                allWords = allWords.concat(topic.words);
            });
        });
        return allWords;
    },

    startGame: function () {
        this.showSection('game-view');
        this.state.game.score = 0;
        this.state.game.questionCount = 0;
        this.state.game.isGameActive = true;

        document.getElementById('game-end').style.display = 'none';
        document.getElementById('game-content').style.display = 'block';
        document.getElementById('score').textContent = '0';

        this.nextQuestion();
    },

    nextQuestion: function () {
        const game = this.state.game;

        if (game.questionCount >= game.maxQuestions) {
            this.endGame();
            return;
        }

        game.questionCount++;
        document.getElementById('question-count').textContent = game.questionCount;
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('game-feedback').textContent = '';
        document.getElementById('game-feedback').className = '';

        const allWords = this.getAllWords();
        // Random word
        const targetWord = allWords[Math.floor(Math.random() * allWords.length)];
        game.currentWord = targetWord;

        // 3 Distractors
        let options = [targetWord];
        while (options.length < 4) {
            const random = allWords[Math.floor(Math.random() * allWords.length)];
            if (!options.includes(random)) {
                options.push(random);
            }
        }

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        // Render Question
        // Randomly ask Meaning->Word or Word->Meaning? Let's stick to Word -> Meaning for now essentially "Guess Meaning"
        const isGuessMeaning = true;

        const questionEl = document.getElementById('game-question');
        const optionsEl = document.getElementById('game-options');

        questionEl.textContent = isGuessMeaning ? targetWord.word : targetWord.meaning;
        optionsEl.innerHTML = '';

        options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'game-option';
            btn.textContent = isGuessMeaning ? opt.meaning : opt.word; // Display answer text
            btn.onclick = () => this.handleAnswer(btn, opt);
            optionsEl.appendChild(btn);
        });

        // Enable clicks
        game.isGameActive = true;
    },

    handleAnswer: function (btnElement, selectedOption) {
        const game = this.state.game;
        if (!game.isGameActive) return;

        game.isGameActive = false; // Disable further clicks
        const isCorrect = selectedOption === game.currentWord;
        const feedback = document.getElementById('game-feedback');

        if (isCorrect) {
            btnElement.classList.add('correct');
            feedback.textContent = 'Chính xác!';
            feedback.style.color = 'var(--success-color)';
            game.score++;
            document.getElementById('score').textContent = game.score;
        } else {
            btnElement.classList.add('wrong');
            feedback.textContent = `Sai rồi! Đáp án đúng là: ${game.currentWord.meaning}`;
            feedback.style.color = 'var(--danger-color)';

            // Highlight correct answer
            const options = document.querySelectorAll('.game-option');
            options.forEach(opt => {
                if (opt.textContent === game.currentWord.meaning) {
                    opt.classList.add('correct');
                }
            });
        }

        document.getElementById('next-btn').style.display = 'inline-block';
    },

    endGame: function () {
        document.getElementById('game-content').style.display = 'none';
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('game-feedback').textContent = '';

        const endScreen = document.getElementById('game-end');
        endScreen.style.display = 'block';
        document.getElementById('final-score').textContent = this.state.game.score;
    }
};

// Start app on load
window.onload = function () {
    app.init();
};
