document.addEventListener('DOMContentLoaded', () => {
    const EVENTS_DELAY = 20000;

    const games = {
        1: {
            name: 'Riding Extreme 3D',
            appToken: 'd28721be-fd2d-4b45-869e-9f253b554e50',
            promoId: '43e35910-c168-4634-ad4f-52fd764a843f',
        },
        2: {
            name: 'Chain Cube 2048',
            appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2',
            promoId: 'b4170868-cef0-424f-8eb9-be0622e8e8e3',
        },
        3: {
            name: 'My Clone Army',
            appToken: '74ee0b5b-775e-4bee-974f-63e7f4d5bacb',
            promoId: 'fe693b26-b342-4159-8808-15e3ff7f8767',
        },
        4: {
            name: 'Train Miner',
            appToken: '82647f43-3f87-402d-88dd-09a90025313f',
            promoId: 'c4480ac7-e178-4973-8061-9ed5b2e17954',
        }
    };

    const startBtn = document.getElementById('startBtn');
    const keyCountSelect = document.getElementById('keyCountSelect');
    const keyCountLabel = document.getElementById('keyCountLabel');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressLog = document.getElementById('progressLog');
    const keyContainer = document.getElementById('keyContainer');
    const keysList = document.getElementById('keysList');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const generatedKeysTitle = document.getElementById('generatedKeysTitle');
    const generateMoreBtn = document.getElementById('generateMoreBtn');
    const copyStatus = document.getElementById('copyStatus');
    const sourceCode = document.getElementById('sourceCode');
    const gameSelect = document.getElementById('gameSelect');

    const clickSound = document.getElementById('clickSound');
    const successSound = document.getElementById('successSound');
    const errorSound = document.getElementById('errorSound');
    const completionSound = document.getElementById('completionSound');

    const playSound = (sound) => {
        if (sound) {
            sound.currentTime = 0; // Restart sound
            sound.play();
        }
    };

    startBtn.addEventListener('click', async () => {
        playSound(clickSound); // Play click sound

        const selectedGame = gameSelect.value;
        const numberOfKeys = parseInt(keyCountSelect.value, 10);

        if (!games[selectedGame]) {
            alert('Please select a valid game.');
            return;
        }

        const { appToken, promoId } = games[selectedGame];
        const clientId = generateClientId();
        let clientToken;

        try {
            clientToken = await login(clientId, appToken);
        } catch (error) {
            console.error('Login failed:', error);
            playSound(errorSound); // Play error sound
            progressLog.innerText = 'Login failed';
            return;
        }

        progressContainer.classList.remove('hidden');
        keyContainer.classList.add('hidden');
        startBtn.classList.add('hidden');
        keyCountSelect.classList.add('hidden');
        gameSelect.classList.add('hidden');
        progressLog.innerText = 'Generating keys...';

        for (let i = 0; i < numberOfKeys; i++) {
            await sleep(delayRandom() * EVENTS_DELAY);

            try {
                if (await emulateProgress(clientToken, promoId)) {
                    const key = await generateKey(clientToken, promoId);
                    const keyItem = document.createElement('div');
                    keyItem.classList.add('key-item');
                    keyItem.innerHTML = `
                        <input type="text" value="${key}" readonly>
                        <button onclick="copyToClipboard(this)">Copy</button>
                    `;
                    keysList.appendChild(keyItem);
                } else {
                    console.error('No code available');
                    progressLog.innerText = 'No code available';
                    playSound(errorSound); // Play error sound
                    return;
                }
            } catch (error) {
                console.error('Key generation failed:', error);
                progressLog.innerText = 'Key generation failed';
                playSound(errorSound); // Play error sound
                return;
            }

            progressBar.style.width = `${Math.round(((i + 1) / numberOfKeys) * 100)}%`;
            progressText.innerText = `${Math.round(((i + 1) / numberOfKeys) * 100)}%`;
        }

        progressLog.innerText = 'Complete';
        playSound(completionSound); // Play completion sound

        generatedKeysTitle.classList.remove('hidden');
        keyContainer.classList.remove('hidden');
        copyAllBtn.classList.remove('hidden');
        generateMoreBtn.classList.remove('hidden');
        copyStatus.classList.add('hidden');
    });

    document.getElementById('generateMoreBtn').addEventListener('click', () => {
        playSound(clickSound); // Play click sound
        progressContainer.classList.add('hidden');
        keyContainer.classList.add('hidden');
        startBtn.classList.remove('hidden');
        keyCountSelect.classList.remove('hidden');
        gameSelect.classList.remove('hidden');
        generatedKeysTitle.classList.add('hidden');
        copyAllBtn.classList.add('hidden');
        keysList.innerHTML = '';
        keyCountLabel.innerText = 'Number of keys:';
    });

    sourceCode.addEventListener('click', () => {
        playSound(clickSound); // Play click sound
        window.open('https://github.com/ShafiqSadat/HamsterKeyGenWeb', '_blank');
    });

    const generateClientId = () => {
        const timestamp = Date.now();
        const randomNumbers = Array.from({ length: 19 }, () => Math.floor(Math.random() * 10)).join('');
        return `${timestamp}-${randomNumbers}`;
    };

    const login = async (clientId, appToken) => {
        const response = await fetch('https://api.gamepromo.io/promo/login-client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                appToken,
                clientId,
                clientOrigin: 'deviceid'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to login');
        }

        const data = await response.json();
        return data.clientToken;
    };

    const emulateProgress = async (clientToken, promoId) => {
        const response = await fetch('https://api.gamepromo.io/promo/register-event', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${clientToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                promoId,
                eventId: generateUUID(),
                eventOrigin: 'undefined'
            })
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.hasCode;
    };

    const generateKey = async (clientToken, promoId) => {
        const response = await fetch('https://api.gamepromo.io/promo/create-code', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${clientToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                promoId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate key');
        }

        const data = await response.json();
        return data.promoCode;
    };

    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const delayRandom = () => Math.random() / 3 + 1;

    window.copyToClipboard = function(button) {
        const keyInput = button.previousElementSibling;
        keyInput.select();
        document.execCommand('copy');
        playSound(successSound); // Play success sound
        copyStatus.classList.remove('hidden');
        setTimeout(() => copyStatus.classList.add('hidden'), 2000);
    };
});
