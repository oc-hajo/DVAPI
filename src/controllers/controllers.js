const User = require('../models/user');
const Challenge = require('../models/challenge')
const path = require('path');
const fs = require('fs');
const http = require('http');
const request = require('request');
const Ticket = require('../models/ticket');
const crypto = require('crypto');
const wrench = 'c6a1d2f21b69f31b87e19348747d41fc'; 
const iv = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');


function generateRandomString(length) {
  return crypto.randomBytes(Math.ceil(length/2))
          .toString('hex')
          .slice(0,length);
}

function extra(){
  const answer = "137a24793a114b40aa2440703cb825ed455ab48320952c431d73d4b6239e9577";
  const decipher = crypto.createDecipheriv('aes-256-cbc', wrench, iv);
  let decrypted = decipher.update(answer, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;

}

const dummyusers = [
  { username: 'admin', password: generateRandomString(32), score: 0, status: 'ACTIVE', secretNote: extra()},
  { username: 'Alice', password: generateRandomString(32), score: 100, secretNote: 'I like pizza. Definitely gonna eat one!' },
  { username: 'Bob', password: generateRandomString(32), score: 200, secretNote: 'I must win this CTF!'},
  { username: 'Charlie', password: generateRandomString(32), score: 300, secretNote: 'What do I write here???' }
];

// Add dummy users to the database
async function addDummyUsers() {
  for (const user of dummyusers) {
    const existinguser = await User.findOne({ username: user.username });
    if (!existinguser) {
      await new User(user).save();
    }
  }
}
addDummyUsers();

const challenges = [
  { challengeNo: 1, flag: '137a24793a114b40aa2440703cb825ed455ab48320952c431d73d4b6239e9577' },
  { challengeNo: 2, flag: '855814a7a4e6a9a0643d69405df664514e46e04e679a0334636e861f1dafdce2' },
  { challengeNo: 3, flag: '998790259c33c4472ff8f4fa34b49508bb9f4a899afa012629cae567767eb7f1d513bbe40aee8b3e819c87f6e2e1174b0d421351aea407f4dabf2eb515956e0e' },
  { challengeNo: 4, flag: '332c59d1e864dd1af2d5c1ea9b9022c04a3a23ec625ce60427d2d9b1f1dd0a71' },
  { challengeNo: 5, flag: '303cf4f43951747393edf9fb2149e1c59fe47620d48950968a70146b5ec0ec07' },
  { challengeNo: 6, flag: '008fd3e6fca2e8b095fd098186052c5e711ef63215d9c1479c585fd2113378d1' },
  { challengeNo: 7, flag: 'ffac5a84466d1a69a59c589cf63489f8303f6528260e323d80c39ffa0a16e219' },
  { challengeNo: 8, flag: 'e437a249928eaf337ce67e299848876eca1f10e1799d38b393d29305321ad70e' },
  { challengeNo: 9, flag: 'c7b29f2076be7df2f1502c55ee40286e385f27d0bcda065f30678e85b040327e882d7711cd643cb94fdd438863e49758' },
  { challengeNo: 10, flag: '6c09249f4efc5d6b95ce3419d1790952b3a37ee634aea77d5a68a3055decf2d1' },
];

// Add flags to the database
async function addChallenges() {
  for (const challenge of challenges) {
    const challengeAdded = await Challenge.findOne({ challengeNo: challenge.challengeNo});
    if (!challengeAdded) {
      await new Challenge(challenge).save();
    }
  }
}
addChallenges();

exports.getHome = (req, res, next) => {
    return res.status(301).redirect('/challenges');
    };

exports.get404 = (req, res, next) => {
    res.render('404', {});
    };

exports.getProfile = (req, res, next) => {
  async function getUserDetails(userId) {
    try {
      console.log('userId:', userId);
      const user = await User.findOne({ _id: userId });
      if(!user){
        return res.json({ message: 'User does not exist' });
      }
      return res.json({ status: "success", user: {
        id: user._id,
        username: user.username,
        score: user.score,
        profilePic: user.profilePic
      } });
    } catch (error) { // handle error
      console.log('Error finding user:', error);
      return res.json({ status: "error", message: 'Error finding user' });
    }
  }
  getUserDetails(req.userId);
  
}

exports.addNote = (req, res, next) => {
    const { note } = req.body;
    if (!note) {
        return res.status(400).json({ status: "error", message: 'Note is required' });
    }
    async function updateUserSecretNote(userId) {
        try {
          const updatedUser = await User.findOneAndUpdate(  // Update the user's secret note
            { _id: userId },
            { secretNote: note },
            { new: true }
          );
          console.log('User updated:', updatedUser);
          return res.json({ status: "success", message: 'Successfully updated note' });
        } catch (error) { // handle error
          console.log('Error updating user:', error);
          res.json({ status: "error", message: 'Failed to add note' });
        }
      }
      updateUserSecretNote(req.userId);
};

exports.getNote = (req, res, next) => {
    async function getUserSecretNote() {
        try {
          const user = await User.findOne({ username: req.query.username });
          console.log('User found:', user);
          return res.json({ status: "success", note: user.secretNote });
        } catch (error) { // handle error
          console.log('Error finding user:', error);
          return res.json({ status: "error", message: 'Error finding user' });
        }
      }
      getUserSecretNote();
}

exports.updateProfile = (req, res, next) => {
  console.log(req.body);
  const { current_password, password, confirm_password } = req.body;
    if (current_password != req.user.password){
      return res.status(401).json({ status: "error", message: 'Enter your current password correctly' });
    }
    if (!password || !confirm_password) { // check if password and confirm_password are provided
      return res.status(400).json({ status: "error", message: 'password and confirm_password required' });
    }
    if(password !== confirm_password){  // check if password and confirm_password match
      return res.status(400).json({ status: "error", message: 'password and confirm_password must match' });
    }
  async function updateUserDetails(userId) {
    try {
      console.log('userId:', userId);
      const updatedUser = await User.findOneAndUpdate(  // Update the user's password
        { _id: userId },
        { password: password },
        { new: true }
      );
      return res.json({ status: "success", message: "User has been successfully updated", user: {
        id: updatedUser._id,
        username: updatedUser.username,
      } });
    } catch (error) { // handle error
      console.log('Failed to update user:', error);
      return res.json({ status: "error", message: 'Failed to update user' });
    }
  }
  updateUserDetails(req.userId);
}

exports.getScores = (req, res, next) => {
  async function getUserScores() {
    try {
      // Find all users with status ACTIVE and return only the username and score in descending order
      const users = await User.find({ status: "ACTIVE" }, { _id: 0, username: 1, score: 1 }).sort({score: -1});
      // Return the username and score for each user
      return users.map(user => ({ username: user.username, score: user.score }));
    } catch (err) {
      console.error(err);
      // Return an empty array if there is an error
      return [];
    }
  }
  getUserScores().then(scores => {
    if (req.user.score >= 10000) {
      answer = '998790259c33c4472ff8f4fa34b49508bb9f4a899afa012629cae567767eb7f1d513bbe40aee8b3e819c87f6e2e1174b0d421351aea407f4dabf2eb515956e0e';
      const decipher = crypto.createDecipheriv('aes-256-cbc', wrench, iv);
      let decrypted = decipher.update(answer, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');
      return res.json({ status: "success", scores: scores , "flag":decrypted})
    }
    return res.json({ status: "success", scores: scores })
  }).catch(err => {
    console.error(err);
    res.json({ status: "error", message: 'Failed to get scores' });
  });
}

// Not a part of DVAPI challenge (pls ignore)
// exports.updateUserStatus = (req, res, next) => { // TODO
//   async function updateUserStatus() {
//     const { username, status } = req.body;
//     console.log(username, status)
//     if (!username || !status) { // Check if username and status are provided
//       return res.status(400).json({ status: "error", message: 'username and status required' });
//     }
//     try {
//       if (status !== 'ACTIVE' && status !== 'BANNED') { // Check if status is valid
//         return res.status(400).json({ status: "error", message: 'status must be ACTIVE or BANNED' });
//       }
//       const updatedUser = await User.findOneAndUpdate(  // Update the user status
//         { username: username },
//         { status: status },
//         { new: false }
//       );
//       if(!updatedUser){ 
//         return res.json({ status: "error", message: 'User does not exist' }); // show this message if user does not exist
//       }
//       if(updatedUser.status === status){
//         return res.json({ status: "error", message: 'User status is already ' + status });  // show this message if user status is already the same
//       }
//       return res.json({ status: "success", message: "User status has been successfully updated to " + status, flag: });  // show this message if user status is updated
//     }
//     catch (err) {
//       console.error(err);
//       return res.json({ status: "error", message: 'Failed to update user status' });  // show this message if there is an error
//     }
//   }
//   updateUserStatus(req.userId)
// }

exports.uploadProfileImage = (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
    const file = req.files.file;
    console.log(file)
    // ADD FILE SIZE CHECK HERE
    const fileSize = (file.size/1024).toFixed(2);
    const allowedExtensions = ['.png', '.jpg', '.jpeg'];
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) { // Check extension if file is an image
      return res.status(400).send('Invalid file type. Only PNG, JPG, and JPEG files are allowed.');
    }
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      // Create directory if it doesn't exist
      fs.mkdirSync(uploadDir);
      console.log(`Created directory: ${uploadDir}`);
    }
    const uploadPath = path.join(__dirname, '../uploads', req.userId + fileExtension);
    const normalizedPath = path.normalize(uploadPath);
    if (!normalizedPath.startsWith(path.join(__dirname, '../uploads'))) {
      return res.status(400).send('Invalid file path');
    }
  
    file.mv(uploadPath, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }
      async function updateUserProfilePic(userId) {
        try {
          const updatedUser = await User.findOneAndUpdate(  // Update the user's profile pic
            { _id: userId },
            { profilePic: req.userId + fileExtension },
            { new: true }
          );
          console.log(updatedUser)
          if(fileSize >= (1024)) {
            if(fileSize >= (1024*50)) {
              answer = '332c59d1e864dd1af2d5c1ea9b9022c04a3a23ec625ce60427d2d9b1f1dd0a71';
              const decipher = crypto.createDecipheriv('aes-256-cbc', wrench, iv);
              let decrypted = decipher.update(answer, 'hex', 'utf-8');
              decrypted += decipher.final('utf-8');
              return res.status(200).json({ message: 'File uploaded successfully', profilePic: req.userId + fileExtension, size: `${(fileSize/1024).toFixed(2)} MB`, flag: decrypted });
            }
            return res.status(200).json({ message: 'File uploaded successfully', profilePic: req.userId + fileExtension, size: `${(fileSize/1024).toFixed(2)} MB` });
          }
          return res.status(200).json({ message: 'File uploaded successfully', profilePic: req.userId + fileExtension, size: `${fileSize} KB` });
        } catch (error) { // handle error
          console.log('Failed to update user:', error);
          return res.status(500).json({ message: 'Failed to update user profile pic' });
        }
      }
      updateUserProfilePic(req.userId);
    });
}

exports.getSolves = (req, res, next) => {
  return res.json({ status: "success",username: req.user.username, solves: req.user.solves})
}

exports.flagSubmit = async (req, res, next) => {
  try {
    const { flag } = req.body;
    const cipher = crypto.createCipheriv('aes-256-cbc', wrench, iv);
    let encrypted = cipher.update(flag, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    console.log(encrypted)
    const challengeNo = parseInt(req.body.challengeNo); 
    if (isNaN(challengeNo) || challengeNo < 1 || challengeNo > 10) {
      return res.status(400).json({ status: "error", message: 'Invalid challenge no' });
    }
    if (!encrypted || typeof encrypted !== 'string') {
      return res.status(400).json({ status: "error", message: "Incorrect Flag", solves: req.user.solves});
    }
    // Check flag for challenge
    const checkFlag = await Challenge.findOne({ challengeNo: challengeNo, flag: encrypted})
    const alreadySolved = await User.findOne({ _id: req.userId, [`solves.${challengeNo}`]: 1})
    console.log("alreadySolved :", alreadySolved);
    if (alreadySolved) {
      return res.status(400).json({ status: "error", message: "Challenge already solved!", solves: req.user.solves});
    }
    if(checkFlag) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.userId },
        { $set: { [`solves.${challengeNo}`]: 1, score: req.user.score + 100 } },
        { new: true }
      );
      console.log('Challenge solved!');
      return res.json({ status: "success", message: 'Challenge solved!', solves:  updatedUser.solves });
    }
    else {
      return res.status(400).json({ status: "error", message: "Incorrect Flag", solves: req.user.solves});
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ status: "error", message: 'Something went wrong while submitting the flag' });
  }
}

exports.submitTicket = (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).send({ Error: "message parameter required" });
    }

    const ticketId = generateId();
    console.log(ticketId);

    checkTicket(ticketId)
      .then(() => {
        const ticket = new Ticket({
          ticketId: ticketId,
          message: message,
          new: true
        });

        ticket.save().then(() => {
          res.send({ status: "success", Message: "Ticket Created your ticketId is :" + ticketId });
        }).catch(() => {
          res.status(400).send({ Error: "Ticket could not be generated try again !!" });
        });
      })
      .catch((err) => {
        answer = '008fd3e6fca2e8b095fd098186052c5e711ef63215d9c1479c585fd2113378d1';
        const decipher = crypto.createDecipheriv('aes-256-cbc', wrench, iv);
        let decrypted = decipher.update(answer, 'hex', 'utf-8');
        decrypted += decipher.final('utf-8');
        res.status(200).json({ msg: 'Unrestricted Access to Sensitive Business Flows', flag :decrypted });
      });

    function generateId() {
      return '10' + Math.floor(1000 + Math.random() * 9000);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ Error: "Something went wrong" });
  }
};

async function checkTicket(ticketId,req, res) {
  try {
    const ticketCount = await Ticket.countDocuments(ticketId );
    console.log(ticketCount);

    if (ticketCount > 150) {
      return Promise.reject();
    } else {
      return Promise.resolve();
    }
  } catch (err) {
    console.error(err.message);
    return Promise.reject();
  }
}

exports.getUser = async (req, res, next) => {
  const user = req.params.username;
  const userProfile = await User.findOne({ username: user }, {
    _id: false,
    password: false,
    secretNote: false,
    status: false
  });
  res.json({ status: 'success', user: userProfile });
}

exports.loginPage = (req, res, next) => {
  res.render('login', {});
}

exports.registerPage = (req, res, next) => {
  res.render('register', {});
}

exports.scoreboardPage = (req, res, next) => {
  res.render('scoreboard', {user: req.user})
}

exports.profilePage = (req, res, next) => {
  res.render('profile', {user: req.user})
}

exports.FileSaver = (req, res, next) => {
  const filePath = path.join(__dirname, 'frontend', 'Cert-Generator-master', 'FileSaver.js');
  res.sendFile(filePath);
};

exports.indexCrt = (req, res, next) => {
  const filePath = path.join(__dirname, 'frontend', 'Cert-Generator-master', 'index.js');
  res.sendFile(filePath);
};

exports.style = (req, res, next) => {
  const filePath = path.join(__dirname, 'frontend', 'Cert-Generator-master', 'style.css');
  res.sendFile(filePath);
};
exports.font = (req, res, next) => {
  const filePath = path.join(__dirname, 'frontend', 'Cert-Generator-master', 'Sanchez-Regular.ttf');
  res.sendFile(filePath);
};

exports.certPage = (req, res, next) => {
  if (req.user.certGenerated) {
    return this.generateCert(req, res);
  }
  res.render('cert', {});
}

exports.challengePage = (req, res, next) => {
  message = null;
  res.render('challenges', { message });
}

exports.userPage = (req, res, next) => {
  console.log(req.user)
  res.render('user', {user: req.user})
}

exports.logout = (req, res, next) => {
  return res.clearCookie('auth').redirect('/login');
  }

// Add note with any link
exports.addNoteWithLink = (req, res) => {
  const { url } = req.body; //get the URL from the request body
  if(!url){
    return res.send('url parameter missing');}
  console.log(url)
    request(url, (err, response, body) => { //make an HTTP request to that URL
    try {
      const note = body.split('\n').slice(0,1).join('\n');
      console.log(note)
      async function updateUserSecretNote(userId) {
        try {
          const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { secretNote: note },
            { new: true }
          );
          console.log('User updated:', updatedUser);
          return res.json({status:"success", message: 'Successfully added a note', note });
        } catch (error) { // handle error
          console.log('Error updating user:', error);
          res.json({ message: 'Failed to add note' });
        }
      }
      updateUserSecretNote(req.userId);
    }
    catch(err){
      res.status(500).send('There was an error: ');
    }
  });
}

exports.checkTicket = (req, res) => {
  const { ticketno } = req.body;
  if (!ticketno) {
    return res.status(400).send({ Error: "ticketno parameter required" });
  }

  async function checkTicket(ticketId) {
    try {
      const ticket = await Ticket.findOne({ ticketId: ticketno });

      if (!ticket) {
        return res.status(404).json({ msg: "Ticket not found" });
      } else {
        res.json({ ticket: ticket.message, ticketno });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send({ Error: "Something went wrong" });
    }
  }
  checkTicket(req.ticketId);
};

exports.allChallenges = (req, res) => {
  const { unreleased } = req.body;
  const { released } = req.body;
  if (unreleased === 1) {
    const answer = "c7b29f2076be7df2f1502c55ee40286e385f27d0bcda065f30678e85b040327e882d7711cd643cb94fdd438863e49758";
    const decipher = crypto.createDecipheriv('aes-256-cbc', wrench, iv);
    let decrypted = decipher.update(answer, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    var unreleasedChallenges = [
      {"id":11, "challengeName":"Challenge11", "shortDescription":"This is challenge11","longDescription":"This is long description of challenge11","challengeLogo":"/image/challenge11.png"},
      {"id":12, "challengeName":"Challenge12", "shortDescription":"This is challenge12 " + decrypted,"longDescription":"This is long description of challenge12","challengeLogo":"/image/challenge12.png"}
    ]
    return res.json({ status: "success", challenges: unreleasedChallenges });
  } else if (released === 1) {
    var releasedChallenges = [
      {"id":1, "challengeName":"API1:2023 Broken Object Level Authorization", "shortDescription":"Drop off during a CTF challenge? No problem. Store a secret note on your profile to track your progress and resume where you left off.","longDescription":"<h2>Learn More - Broken Object Level Authorization</h2><br><img src='/images/API1.jpg' alt='Images:Freepik​' style='display: block; margin: 0 auto;' width='500px' height='250px'></img><br><p style='padding: 0 30px;'>Object level authorization ensures that only authorized users have access to specific resources or actions. However, in the case of broken object level authorization, there are vulnerabilities that allow unauthorized users to access or modify sensitive data or perform actions they shouldn't have permission for.</p>","challengeLogo":"/image/challenge1.png"},
      {"id":2, "challengeName":"API2:2023 Broken Authentication", "shortDescription":"Admin has a challenge for you. Admin says anyone who can log in with their account will get some surprise. Can you find out the surprise?","longDescription":"<h2>Learn More - Broken Authentication</h2><br><img src='/images/API2.png' alt='Images:Freepik​' style='display: block; margin: 0 auto;' width='500px' height='250px'></img><br><p style='padding: 0 30px;'>Authentication endpoints, which are typically public-facing, are a common target for attackers. To prevent attacks, these endpoints should have extra protection measures in place. However, misconfigurations can occur due to insufficient threat modeling.</p>","challengeLogo":"/image/challenge2.png"},
      {"id":3, "challengeName":"API3:2023 Broken Object Property Level Authorization", "shortDescription":"Ever wished there was a cheat code to top the scoreboard?","longDescription":"<h2>Learn More - Broken Object Property Level Authorization</h2><br><img src='/images/API3.jpg'alt='Images:Freepik​' style='display: block; margin: 0 auto;' width='500px' height='250px'></img><br><p style='padding: 0 30px;'>APIs perform actions on objects and their properties. Developers may neglect property level authorization, allowing users to modify object properties they shouldn't access, despite having object level authorization.</p>","challengeLogo":"/image/challenge3.png"},
      {"id":4, "challengeName":"API4:2023 Unrestricted Resource Consumption", "shortDescription":"Do you know that you can customize your profile? Try it out and make your profile stand out among others.","longDescription":"<h2>Learn More - Unrestricted Resource Consumption</h2><br><img src='/images/API4.jpg' alt='Images:Freepik​' style='display: block; margin: 0 auto;' width='500px' height='250px'></img><br><p style='padding: 0 30px;'>API requests consume resources such as CPU/memory, bandwidth, storage, and integrations with other services. Attackers can cause high resource consumption by sending excessive requests, leading to unresponsive APIs or increased business expenses.</p>","challengeLogo":"/image/challenge4.png"},
      {"id":5, "challengeName":"API5:2023 Broken Function Level Authorization", "shortDescription":"DVAPI has many users. You can see other's profile and others can see yours. What could go wrong here? Right? Right???","longDescription":"<h2>Learn More - Broken Function Level Authorization</h2><br><img src='/images/API5.jpg' alt='Images:Freepik​' style='display: block; margin: 0 auto;' width='500px' height='250px'></img><br><p style='padding: 0 30px;'>APIs enable users to perform specific functions on API objects, with some of these functions restricted to certain user permissions. It is crucial to implement proper authorization checks for API functions to ensure users are granted the correct privileges for object manipulation.</p>","challengeLogo":"/image/challenge5.png"},
      {"id":6, "challengeName":"API6:2023 Unrestricted Access to Sensitive Business Flows", "shortDescription":"DVAPI is a people first applicaiton. We are keen on knowing your requests through submit ticket function. Maybe it'll help you find the flag !!!","longDescription":"<h2>Learn More - Unrestricted Access to Sensitive Business Flows</h2><br><img src='/images/API6.jpg' alt='Images:Freepik​' style='display: block; margin: 0 auto;' width='500px' height='250px'></img><br><p style='padding: 0 30px;'>Unrestricted Access to Sensitive Business Flows is a critical vulnerability that enables attackers to exploit APIs by gaining excessive access to sensitive business processes. This vulnerability occurs when API endpoints expose critical flows without appropriate access restrictions, leading to potential harm to the business.</p><br><p style='padding: 0 30px;'>Attackers leverage their understanding of the target business model and automate access to sensitive flows, causing various forms of harm. Lack of a holistic view of the API and inadequate protection mechanisms contribute to the prevalence of this vulnerability.</p><br><p style='padding: 0 30px;'>As a quick example of this vulnerability, consider an ecommerce application that is about to run a flash sale wherein limited amount of an exclusive item is sold. Customers eagerly wait for the sale to start. When the sale starts, an attacker uses an automated script to quickly order all the items on the sale. Using this opportunity of scarcity of the exclusive products, they resell at higher prices to make a profit.</p><br><p style='padding: 0 30px;'>To mitigate this vulnerability, it is crucial to identify sensitive business flows and implement appropriate access restrictions. Businesses should adopt protective measures such as device fingerprinting, human detection mechanisms (e.g., captcha, typing patterns), analyzing non-human patterns, and considering IP address blocking of known proxies and Tor exit nodes.</p><br><a style='padding: 0 30px;' href='https://owasp.org/API-Security/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows/'>Unrestricted Access to Sensitive Business Flows - OWASP</a>","challengeLogo":"/image/challenge6.png"},
      {"id":7, "challengeName":"API7:2023 Server Side Request Forgery", "shortDescription":"DVAPI is using a function to set SecretNote for your user through a link/url. Try to learn more about SSRF and capture the flag !!!","longDescription":"<h2>Learn More - Server Side Request Forgery</h2><br><img src='/images/API7.jpg' alt='Images:Freepik​' style='display: block; margin: 0 auto;' width='500px' height='250px'></img><br><p style='padding: 0 30px;'>Server-Side Request Forgery (SSRF) flaws occur whenever an API is fetching a remote resource without validating the user-supplied URL. It allows an attacker to coerce the application to send a crafted request to an unexpected destination, even when protected by a firewall or a VPN.</p><br><p style='padding: 0 30px;'>So, imagine you're a hacker and you want to get access to some secret data or functionality on a server that you're not supposed to have access to. How would you do it? You can't just waltz in through the front door, right? Well, that's where SSRF comes in. SSRF stands for Server-Side Request Forgery, and it's a technique that allows a hacker to trick a server into making requests on their behalf. It's like getting the server to open the back door for you without it even realizing it!</p><br><p style='padding: 0 30px;'>How does it work? Well, the hacker will first find a vulnerable website that allows them to input a URL. Then, they'll craft a special URL that points to the server they want to attack. When the vulnerable website makes a request to the URL provided by the hacker, it will include the hacker's malicious instructions in the request headers. These instructions can include things like accessing internal resources or even executing commands on the server!</p><p style='padding: 0 30px;'>So, SSRF is like having a secret passageway that lets you bypass all the security measures put in place to keep you out. It's a sneaky and dangerous technique, but also kind of cool in a 'Mission Impossible' sort of way, don't you think?</p><br><a style='padding: 0 30px;' href='https://payatu.com/blog/a-basic-approach-to-ssrf'>Learn SSRF</a><br><a style='padding: 0 30px;' href='https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery'>SSRF Attacks</a>","challengeLogo":"/image/challenge7.png"},
      {"id":8, "challengeName":"API8:2023 Security Misconfiguration", "shortDescription":"The Developers at DVAPI are lazy which has led to a misconfigured system. Find the misconfiguration and submit the flag !!!","longDescription":"<h2>Learn More - Security Misconfiguration</h2><br><img src='/images/API8.jpg' alt='Images:Freepik​' style='display: block; margin: 0 auto;' width='500px' height='250px'></img><br><p style='padding: 0 30px;'>A security misconfiguration arises when essential security settings are either not implemented or implemented with errors.</p><br><p style='padding: 0 30px;'>In the world of cybersecurity, security misconfiguration is a vulnerability that arises when systems or applications are not configured properly. It's like leaving the front door of your house unlocked or your windows wide open. It's an open invitation to attackers who are looking for an easy way in.</p><br><p style='padding: 0 30px;'>Security misconfiguration can take many forms, such as not changing default passwords, not patching systems with security updates, or leaving unnecessary ports open or giving out sensitive information in errors. Hackers can exploit these misconfigurations to gain access to sensitive data or to take control of systems.</p><br><a style='padding: 0 30px;' href='https://brightsec.com/blog/security-misconfiguration/'>Understanding Security Misconfiguration</a>","challengeLogo":"/image/challenge8.png"},
      {"id":9, "challengeName":"API9:2023 Improper Inventory Management", "shortDescription":"There was a data leak at DVAPI. People found out there are 12 Challenges and not 10, What do you think ?","longDescription":"<h2>Learn More - Improper Inventory Management</h2><br><img src='/images/API9.jpg' alt='Images:Freepik​' style='display: block; margin: 0 auto;' width='500px' height='250px'></img><br><p style='padding: 0 30px;'>Improper management of APIs refers to instances when the production APIs are built, utilized, and then no longer managed without being terminated.</p><br><p style='padding: 0 30px;'>Asset management is all about keeping track of what you have, what you need, and when you need it. When it comes to APIs, improper inventory management can mean not keeping track of all the APIs in use, their access levels, or who has access to them, uat endpoints left open in prod. It's like not having a proper recipe for the cake you want to bake – you might have some ingredients, but without the right recipe, you won't end up with the cake you wanted.</p><br><p style='padding: 0 30px;'>This can lead to security vulnerabilities, such as unauthorized access or data leaks.</p>","challengeLogo":"/image/challenge9.png"},
      {"id":10, "challengeName":"API10:2023 Unsafe Consumption of APIs", "shortDescription":"API's used at the Authentication of the application does not look safe, can you test it and get the flag ??","longDescription":"<h2>Learn More - Unsafe Consumption of APIs</h2><br><img src='/images/API10.jpg' alt='Images:Freepik​' style='display: block; margin: 0 auto;' width='500px' height='250px'></img><br><p style='padding: 0 30px;'>Developers tend to trust data received from third-party APIs more than user input. This is especially true for APIs offered by well-known companies. Because of that, developers tend to adopt weaker security standards, for instance, in regards to input validation and sanitization.</p><br><p style='padding: 0 30px;'>Have you ever heard the phrase 'you are what you eat'? Well, in the world of cybersecurity, the same can be said for APIs. Unsafe consumption of APIs is like eating something that might look good, but could actually be harmful to you.</p><p style='padding: 0 30px;'>APIs are like the ingredients in a recipe – they come in all shapes and sizes, and you need to be careful about how you consume them. Unsafe consumption of APIs means using APIs in a way that exposes your systems to security vulnerabilities. It's like eating something that might look and smell good, but could give you food poisoning.</p><br><p style='padding: 0 30px;'>This can happen when you don't properly authenticate or authorize API requests, or when you don't sanitize user inputs. It's like not properly washing your hands or cooking your food – it can lead to harmful bacteria and germs entering your system.</p>","challengeLogo":"/image/challenge10.png"}
    ]
    return res.json({ status: "success", challenges: releasedChallenges })
  } else {
    return res.status(500).json({ status: "error", message: "Something went wrong" });
  }
};
exports.deleteUser = async (req, res, next) => { 
  const user = req.params.username; 
  const answer= '303cf4f43951747393edf9fb2149e1c59fe47620d48950968a70146b5ec0ec07';
  if ( user === 'admin' ) { 
    return res.json({ status: 'error', message: 'Cannot delete this account' }); } 
    const deletedUser = await User.deleteOne({ username: user }); 
    console.log(deletedUser.deletedCount) 
    if ( deletedUser.deletedCount > 0 ) {
      const decipher = crypto.createDecipheriv('aes-256-cbc', wrench, iv);
      let decrypted = decipher.update(answer, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8'); 
      return res.json({ status: 'success', message: 'User deleted successfully',flag:decrypted }); 
    } 
      else { 
        return res.json({ status: 'error', message: 'User does not exist' }); 
} } 

const HOST = 'localhost';
const PORT = 42;

const server = http.createServer((req, res) => {
  answer="ffac5a84466d1a69a59c589cf63489f8303f6528260e323d80c39ffa0a16e219";
  const decipher = crypto.createDecipheriv('aes-256-cbc', wrench, iv);
  let decrypted = decipher.update(answer, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  return res.end(decrypted);
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});

exports.generateCert = async (req, res) => {
  const filePath = path.join(__dirname, 'frontend', 'cert.pdf');

  const capitalize = (str, lower = false) =>
    (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
      match.toUpperCase()
    );
  
  const PDFLib = require(path.join(__dirname, 'frontend', 'Cert-Generator-master', 'pdflib-1.4.0.js'));
  const fontkit = require(path.join(__dirname, 'frontend', 'Cert-Generator-master', 'fontkit-0.0.4.js'));
  const { PDFDocument, rgb } = PDFLib;

  const generatePDF = async (name) => {
    const existingPdfBytes = fs.readFileSync(filePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const fontPath = path.join(__dirname, 'frontend', 'Cert-Generator-master', 'Sanchez-Regular.ttf');
    const fontBytes = fs.readFileSync(fontPath);

    const SanChezFont = await pdfDoc.embedFont(fontBytes);
    console.log(SanChezFont);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const nameWidth = SanChezFont.widthOfTextAtSize(name, 58);
    const centerX = firstPage.getWidth() / 2;
    const nameX = centerX - nameWidth / 2;

    firstPage.drawText(name, {
      x: nameX,
      y: 260,
      size: 58,
      font: SanChezFont,
      color: rgb(0.94, 0.97, 1.0),
    });

    const pdfBytes = await pdfDoc.save();

    return pdfBytes;
  };

  try {
    const user = await User.findOne({ username: req.user.username });
    if (user.certGenerated) {
      var userName = req.user.certGeneratedName;
    }
    else {
      const { name } = req.body;
      var userName = capitalize(name);
      
    }
    const pdfBytes = await generatePDF(userName);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="DVAPI-Certificate.pdf"');
    res.send(Buffer.from(pdfBytes.buffer));

    // Update the user's certGenerated and certGeneratedName fields
    await User.findOneAndUpdate(
      { username: req.user.username },
      { certGenerated: true, certGeneratedName: userName }
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
};