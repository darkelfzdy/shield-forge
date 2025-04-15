// 字符集定义（排除易混淆字符）
const CHAR_SETS = {
    uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',  // 排除I、O
    lowercase: 'abcdefghijkmnpqrstuvwxyz',  // 排除l、o
    numbers: '23456789',                    // 排除0、1
    symbols: '!@#$%^&*()_+-=?'
};

// 密码生成核心逻辑
function generatePassword(config) {
    const selectedTypes = Object.entries(config.types)
        .filter(([_, value]) => value)
        .map(([key]) => key);

    if (selectedTypes.length === 0) {
        throw new Error('至少需要选择一种字符类型');
    }

    // 为每种选中的类型至少选择一个字符
    let password = '';
    selectedTypes.forEach(type => {
        const chars = config.excludeSimilar ?
            CHAR_SETS[type].replace(/[1lI0O]/g, '') :
            CHAR_SETS[type];
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        password += randomChar;
    });

    // 构建完整字符集用于剩余字符
    let fullCharset = '';
    selectedTypes.forEach(type => {
        fullCharset += config.excludeSimilar ?
            CHAR_SETS[type].replace(/[1lI0O]/g, '') :
            CHAR_SETS[type];
    });

    // 填充剩余长度
    while (password.length < config.length) {
        const randomIndex = Math.floor(Math.random() * fullCharset.length);
        password += fullCharset[randomIndex];
    }

    // 打乱密码顺序
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    // OWASP合规模式强制要求
    if (config.saveMode) {
        config.length = Math.max(config.length, 12);
        const hasAllTypes = selectedTypes.length === 4;
        if (!hasAllTypes) {
            password = enforceOWASPRules(password, selectedTypes);
        }
    }

    return password;
}

// OWASP合规增强
function enforceOWASPRules(pwd, usedTypes) {
    const requiredTypes = Object.keys(CHAR_SETS).filter(t => !usedTypes.includes(t));
    requiredTypes.forEach(type => {
        const chars = CHAR_SETS[type];
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        pwd = insertAtRandomPosition(pwd, randomChar);
    });
    return pwd;
}

function insertAtRandomPosition(str, char) {
    const pos = Math.floor(Math.random() * str.length);
    return str.slice(0, pos) + char + str.slice(pos);
}

// 密码强度计算（基于熵）
function calculateEntropy(password, charsetSize) {
    const length = password.length;
    return Math.log2(Math.pow(charsetSize, length)).toFixed(1);
}

// 初始化事件监听
document.getElementById('generateBtn').addEventListener('click', () => {
    try {
        const config = {
            length: parseInt(document.getElementById('length').value),
            types: {
                uppercase: document.getElementById('uppercase').checked,
                lowercase: document.getElementById('lowercase').checked,
                numbers: document.getElementById('numbers').checked,
                symbols: document.getElementById('symbols').checked
            },
            excludeSimilar: document.getElementById('excludeSimilar').checked,
            saveMode: document.getElementById('saveMode').checked
        };

        const password = generatePassword(config);
        document.getElementById('password').value = password;
        
        // 更新强度指示
        const charsetSize = Object.values(config.types)
            .filter(Boolean)
            .reduce((sum, _, i) => sum + CHAR_SETS[Object.keys(config.types)[i]].length, 0);
        
        const entropy = calculateEntropy(password, charsetSize);
        updateStrengthIndicator(entropy);

    } catch (error) {
        alert(error.message);
    }
});

// 更新强度显示
function updateStrengthIndicator(entropy) {
    const strengthBar = document.querySelector('.strength-bar');
    let strengthColor = '';
    
    if (entropy < 60) {
        strengthColor = '#e74c3c'; // 红
        strengthBar.style.width = '25%';
    } else if (entropy < 80) {
        strengthColor = '#f1c40f'; // 黄
        strengthBar.style.width = '50%';
    } else if (entropy < 100) {
        strengthColor = '#2ecc71'; // 绿
        strengthBar.style.width = '75%';
    } else {
        strengthColor = '#3498db'; // 蓝
        strengthBar.style.width = '100%';
    }
    
    strengthBar.style.backgroundColor = strengthColor;
}

// 复制功能
function copyPassword() {
    const passwordField = document.getElementById('password');
    passwordField.select();
    document.execCommand('copy');
    
    // 视觉反馈
    const copyBtn = document.querySelector('.copy-btn');
    copyBtn.textContent = '✅ 已复制';
    setTimeout(() => {
        copyBtn.textContent = '📋';
    }, 2000);
}