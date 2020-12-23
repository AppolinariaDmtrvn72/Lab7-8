class Messanger {
  constructor() {
    document.querySelector(".invite-new-user").onclick = () =>
      this.getNewUser();

    this.userList = document.querySelector(".users");
    this.messages = document.querySelector(".messages");

    this.textInput = document.querySelector(".chat-input-msg");
    this.sendBtn = document.querySelector(".send-msg");

    /*
      Probably would be better to load this mock info about "current user" from local .json file
    */
    this.currentUser = {
      fullname: "Oleh Melnyk",
      username: "olehmelnyk",
      age: 28,
      phone: "+380631215555",
      email: "oleh.melnyk@gmail.com",
      avatar: "https://avatars.githubusercontent.com/olehmelnyk",
      city: "Lviv",
      gender: "male"
    };

    // send user msg on "Send" btn press
    this.sendBtn.onclick = () => {
      this.addMSGFromCurrentUser();
    };

    // send user msg on Enter key press
    this.textInput.onkeypress = event => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.addMSGFromCurrentUser();
      }
    };

    // array, that contains users, who are currently "typing", and will send their msg shortly
    this.usersIsTyping = [];

    this.status = document.createElement("div");
    this.status.classList.add("typing-status");
    document.querySelector(".messages-list").appendChild(this.status);
  }

  
  getNewUser() {
    this.makeRequest("https://randomuser.me/api/")
      .then(data => {
        const userData = data.results[0];

        const fullname = `${this.capitalize(
          userData.name.first
        )} ${this.capitalize(userData.name.last)}`;

        // user age is often over 45, but profile pictures look young,
        // so, let's make this fake data look a bit more realistic ;)
        const age = userData.dob.age;
        const userAge = age > 45 ? Math.floor(age / 2) : age;

        const user = {
          fullname,
          username: userData.login.username,
          age: userAge,
          phone: userData.cell,
          email: userData.email,
          avatar: userData.picture.medium,
          city: this.capitalize(userData.location.city),
          gender: userData.gender
        };

        user.msgIntervalId = this.setNewMSGInterval(user); // this is the ID we need to pass to clearInterval() function to cancel interval

        this.addUserToDOM(user);
        this.addStatusMSG(
          `${user.fullname} joined group chat at ${this.getCurrentTime()}`
        );
      })
      .catch(error => console.error(error.message));
  }

  getNewMessage() {
    const paragraphsCount = this.getRandomNumber(1, 5);
    const paragraphMinLength = this.getRandomNumber(1, 5);
    const paragraphMaxLength = this.getRandomNumber(10, 25);

    return this.makeRequest(
      `https://www.randomtext.me/api/gibberish/p-${paragraphsCount}/${paragraphMinLength}-${paragraphMaxLength}`
    )
      .then(message => message.text_out)
      .catch(error => console.error(error.message));
  }

  setNewMSGInterval(user, interval = this.getRandomNumber(5, 30) * 1000) {
    this.setUserIsTypingInterval(user, interval);

    // intercal that adds messages
    const intervalId = setInterval(() => {
      this.addMSGToDOM(user);

      this.usersIsTyping = this.usersIsTyping.filter(u => u !== user.fullname);
      this.updateIsTypingStatus();
    }, interval);

    return intervalId;
  }

 
  addStatusMSG(message) {
    if (typeof message === "string" && message.trim()) {
      const msg = document.createElement("li");

      msg.classList.add("status-msg");
      msg.textContent = message.trim();

      this.messages.appendChild(msg);
      this.scrollToBottom(this.messages);
    }
  }

  addMSGToDOM(user, isMe = false, myMSG = "🤣") {
    this.getNewMessage().then(messageText => {
      const msg = document.createElement("li");
      const avatar = document.createElement("img");
      const msgText = document.createElement("div");
      const msgTime = document.createElement("div");

      msg.classList.add("msg");
      if (isMe) {
        msg.classList.add("me");
      }

      avatar.classList.add("user-avatar");
      avatar.src = user.avatar;
      avatar.alt = user.fullname;
      avatar.title = user.fullname;

      msgText.classList.add("msg-text");
      msgText.innerHTML = isMe ? myMSG : messageText;

      msgTime.classList.add("msg-time");
      msgTime.textContent = this.getCurrentTime();

      msg.appendChild(avatar);
      msg.appendChild(msgText);
      msg.appendChild(msgTime);

      this.messages.appendChild(msg);
      this.scrollToBottom(this.messages);
    });
  }

 
  addMSGFromCurrentUser() {
    const msg = this.textInput.value.trim();

    if (msg) {
      this.addMSGToDOM(this.currentUser, true, this.textInput.value.trim());
      this.textInput.value = "";
      this.textInput.focus();
    }
  }

 
  addUserToDOM(user) {
    const li = document.createElement("li");
    const avatar = document.createElement("img");
    const userInfo = document.createElement("div");
    const userFullname = document.createElement("div");
    const userEmail = document.createElement("div");
    const userActions = document.createElement("div");
    const muteUser = document.createElement("button");

    const bio = `${user.fullname} is a ${user.age} years old ${
      user.gender
    } from ${user.city}.`;
    const aboutUser = `${user.age} years • ${user.gender} • ${user.city}`;

    li.classList.add("user");
    li.title = bio;

    avatar.classList.add("user-avatar");
    avatar.src = user.avatar;
    avatar.alt = user.fullname;
    avatar.title = user.fullname;

    userInfo.classList.add("user-info");
    userFullname.classList.add("user-fullname");
    userEmail.classList.add("user-email");

    userFullname.textContent = user.fullname;
    userEmail.textContent = aboutUser; //user.email;

    userActions.classList.add("user-actions");

    muteUser.classList.add("btn");
    muteUser.textContent = "Mute";
    muteUser.title = "Remove user";

    // remove user after click on "Mute" btn
    muteUser.onclick = () => {
      this.removeUser(user, li);
    };

    userInfo.appendChild(userFullname);
    userInfo.appendChild(userEmail);

    userActions.appendChild(muteUser);

    li.appendChild(avatar);
    li.appendChild(userInfo);
    li.appendChild(userActions);

    this.userList.appendChild(li);
  }


  removeUser(user, li) {
    if (li instanceof HTMLElement && li.nodeName === "LI") {
      this.addStatusMSG(
        `${user.fullname} left group chat at ${this.getCurrentTime()}`
      );

      clearInterval(user.msgIntervalId);

      this.usersIsTyping = this.usersIsTyping.filter(
        item => item !== user.fullname
      );
      clearInterval(user.isTypingId);

      li.remove();

      this.updateIsTypingStatus();
    }
  }

  setUserIsTypingInterval(user, interval) {
    user.isTypingId = setInterval(() => {
      if (!this.usersIsTyping.includes(user.fullname)) {
        this.usersIsTyping.push(user.fullname);
        this.updateIsTypingStatus();
      }
    }, interval - 3000);
  }

 
  updateIsTypingStatus() {
    const typingCount = this.usersIsTyping.length;

    if (typingCount === 0) {
      this.status.textContent = "";
      return;
    }

    let msg = "";

    if (typingCount === 1) {
      msg = `${this.usersIsTyping[0]} is typing...`;
    } else if (typingCount > 1 && typingCount <= 3) {
      msg = `${this.usersIsTyping.join(", ")} are typing...`;
    } else if (typingCount > 3) {
      msg = `${this.usersIsTyping.slice(0, 3).join(", ")} and ${typingCount -
        3} other are typing...`;
    }

    this.status.textContent = msg;
  }

  makeRequest(url, method = "GET", async = true) {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url, async);
    xhr.send();

    return new Promise((resolve, reject) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;

        if (xhr.status !== 200) {
          reject(`${xhr.status}: ${xhr.statusText}`);
        } else {
          resolve(JSON.parse(xhr.responseText));
        }
      };
    });
  }


  getRandomNumber(min = 1, max = 30) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  capitalize(string) {
    if (typeof string === "string" && string.trim()) {
      return string
        .trim()
        .split(" ")
        .map(word => word[0].toUpperCase() + word.slice(1))
        .join(" ");
    }
  }


  getCurrentTime() {
    return new Date().toLocaleTimeString();
  }


  scrollToBottom(element) {
    if (element instanceof HTMLElement) {
      element.scrollTop = element.scrollHeight; // auto scroll to bottom
    }
  }
}

// initialization
const messanger = new Messanger();

const PointTarget = ReactPoint.PointTarget
class AutoScalingText extends React.Component {
  state = {
    scale: 1
  };
  
  componentDidUpdate() {
    const { scale } = this.state
    
    const node = this.node
    const parentNode = node.parentNode
    
    const availableWidth = parentNode.offsetWidth
    const actualWidth = node.offsetWidth
    const actualScale = availableWidth / actualWidth
    
    if (scale === actualScale)
      return
    
    if (actualScale < 1) {
      this.setState({ scale: actualScale })
    } else if (scale < 1) {
      this.setState({ scale: 1 })
    }
  }
  
  render() {
    const { scale } = this.state
    
    return (
      <div
        className="auto-scaling-text"
        style={{ transform: `scale(${scale},${scale})` }}
        ref={node => this.node = node}
      >{this.props.children}</div>
    )
  }
}

class CalculatorDisplay extends React.Component {
  render() {
    const { value, ...props } = this.props
    
    const language = navigator.language || 'en-US'
    let formattedValue = parseFloat(value).toLocaleString(language, {
      useGrouping: true,
      maximumFractionDigits: 6
    })
    
    // Add back missing .0 in e.g. 12.0
    const match = value.match(/\.\d*?(0*)$/)
    
    if (match)
      formattedValue += (/[1-9]/).test(match[0]) ? match[1] : match[0]
    
    return (
      <div {...props} className="calculator-display">
        <AutoScalingText>{formattedValue}</AutoScalingText>
      </div>
    )
  }
}

class CalculatorKey extends React.Component {
  render() {
    const { onPress, className, ...props } = this.props
    
    return (
      <PointTarget onPoint={onPress}>
        <button className={`calculator-key ${className}`} {...props}/>
      </PointTarget>
    )
  }
}

const CalculatorOperations = {
  '/': (prevValue, nextValue) => prevValue / nextValue,
  '*': (prevValue, nextValue) => prevValue * nextValue,
  '+': (prevValue, nextValue) => prevValue + nextValue,
  '-': (prevValue, nextValue) => prevValue - nextValue,
  '=': (prevValue, nextValue) => nextValue
}

class Calculator extends React.Component {
  state = {
    value: null,
    displayValue: '0',
    operator: null,
    waitingForOperand: false
  };
  
  clearAll() {
    this.setState({
      value: null,
      displayValue: '0',
      operator: null,
      waitingForOperand: false
    })
  }

  clearDisplay() {
    this.setState({
      displayValue: '0'
    })
  }
  
  clearLastChar() {
    const { displayValue } = this.state
    
    this.setState({
      displayValue: displayValue.substring(0, displayValue.length - 1) || '0'
    })
  }
  
  toggleSign() {
    const { displayValue } = this.state
    const newValue = parseFloat(displayValue) * -1
    
    this.setState({
      displayValue: String(newValue)
    })
  }
  
  inputPercent() {
    const { displayValue } = this.state
    const currentValue = parseFloat(displayValue)
    
    if (currentValue === 0)
      return
    
    const fixedDigits = displayValue.replace(/^-?\d*\.?/, '')
    const newValue = parseFloat(displayValue) / 100
    
    this.setState({
      displayValue: String(newValue.toFixed(fixedDigits.length + 2))
    })
  }
  
  inputDot() {
    const { displayValue } = this.state
    
    if (!(/\./).test(displayValue)) {
      this.setState({
        displayValue: displayValue + '.',
        waitingForOperand: false
      })
    }
  }
  
  inputDigit(digit) {
    const { displayValue, waitingForOperand } = this.state
    
    if (waitingForOperand) {
      this.setState({
        displayValue: String(digit),
        waitingForOperand: false
      })
    } else {
      this.setState({
        displayValue: displayValue === '0' ? String(digit) : displayValue + digit
      })
    }
  }
  
  performOperation(nextOperator) {    
    const { value, displayValue, operator } = this.state
    const inputValue = parseFloat(displayValue)
    
    if (value == null) {
      this.setState({
        value: inputValue
      })
    } else if (operator) {
      const currentValue = value || 0
      const newValue = CalculatorOperations[operator](currentValue, inputValue)
      
      this.setState({
        value: newValue,
        displayValue: String(newValue)
      })
    }
    
    this.setState({
      waitingForOperand: true,
      operator: nextOperator
    })
  }
  
  handleKeyDown = (event) => {
    let { key } = event
    
    if (key === 'Enter')
      key = '='
    
    if ((/\d/).test(key)) {
      event.preventDefault()
      this.inputDigit(parseInt(key, 10))
    } else if (key in CalculatorOperations) {
      event.preventDefault()
      this.performOperation(key)
    } else if (key === '.') {
      event.preventDefault()
      this.inputDot()
    } else if (key === '%') {
      event.preventDefault()
      this.inputPercent()
    } else if (key === 'Backspace') {
      event.preventDefault()
      this.clearLastChar()
    } else if (key === 'Clear') {
      event.preventDefault()
      
      if (this.state.displayValue !== '0') {
        this.clearDisplay()
      } else {
        this.clearAll()
      }
    }
  };
  
  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown)
  }
  
  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown)
  }
  
  render() {
    const { displayValue } = this.state
    
    const clearDisplay = displayValue !== '0'
    const clearText = clearDisplay ? 'C' : 'AC'
    
    return (
      <div className="calculator">
        <CalculatorDisplay value={displayValue}/>
        <div className="calculator-keypad">
          <div className="input-keys">
            <div className="function-keys">
              <CalculatorKey className="key-clear" onPress={() => clearDisplay ? this.clearDisplay() : this.clearAll()}>{clearText}</CalculatorKey>
              <CalculatorKey className="key-sign" onPress={() => this.toggleSign()}>±</CalculatorKey>
              <CalculatorKey className="key-percent" onPress={() => this.inputPercent()}>%</CalculatorKey>
            </div>
            <div className="digit-keys">
              <CalculatorKey className="key-0" onPress={() => this.inputDigit(0)}>0</CalculatorKey>
              <CalculatorKey className="key-dot" onPress={() => this.inputDot()}>●</CalculatorKey>
              <CalculatorKey className="key-1" onPress={() => this.inputDigit(1)}>1</CalculatorKey>
              <CalculatorKey className="key-2" onPress={() => this.inputDigit(2)}>2</CalculatorKey>
              <CalculatorKey className="key-3" onPress={() => this.inputDigit(3)}>3</CalculatorKey>
              <CalculatorKey className="key-4" onPress={() => this.inputDigit(4)}>4</CalculatorKey>
              <CalculatorKey className="key-5" onPress={() => this.inputDigit(5)}>5</CalculatorKey>
              <CalculatorKey className="key-6" onPress={() => this.inputDigit(6)}>6</CalculatorKey>
              <CalculatorKey className="key-7" onPress={() => this.inputDigit(7)}>7</CalculatorKey>
              <CalculatorKey className="key-8" onPress={() => this.inputDigit(8)}>8</CalculatorKey>
              <CalculatorKey className="key-9" onPress={() => this.inputDigit(9)}>9</CalculatorKey>
            </div>
          </div>
          <div className="operator-keys">
            <CalculatorKey className="key-divide" onPress={() => this.performOperation('/')}>÷</CalculatorKey>
            <CalculatorKey className="key-multiply" onPress={() => this.performOperation('*')}>×</CalculatorKey>
            <CalculatorKey className="key-subtract" onPress={() => this.performOperation('-')}>−</CalculatorKey>
            <CalculatorKey className="key-add" onPress={() => this.performOperation('+')}>+</CalculatorKey>
            <CalculatorKey className="key-equals" onPress={() => this.performOperation('=')}>=</CalculatorKey>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <Calculator/>,
  document.getElementById('app')
)
