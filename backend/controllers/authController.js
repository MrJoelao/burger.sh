const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { signUser } = require('../utils/jwt');

// arrivati a questo punto i dati sono già stati validati nel middleware quindi non c'è bisogno di fare nessuna verifica

async function register(req, res, next) {
  try {
    const { name, surname, email, password, role } = req.validated;

    // controllo che l'email non sia già usata
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }

    const passwordHash = await hashPassword(password);

    const userData = {
      name,
      surname,
      email,
      passwordHash,
      role // customer o manager
    };

    // solo i manager hanno managerStatus
    if (role === 'manager') {
      userData.managerStatus = 'pending';
    }

    const user = await User.create(userData);

    const token = signUser(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          surname: user.surname,
          email: user.email,
          role: user.role,
          managerStatus: user.managerStatus ?? null
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.validated;

    // trovo l'utente cercando la password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials: email not found'
      });
    }

    // verifico la password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials: invalid password'
      });
    }

    const token = signUser(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          surname: user.surname,
          email: user.email,
          role: user.role,
          managerStatus: user.managerStatus ?? null
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login
};
