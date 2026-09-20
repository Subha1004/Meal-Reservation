const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    session: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
    attended: { type: Boolean, default: false },
    guestAttended: { type: Number, default: 0, min: 0 },
    isNoShow: { type: Boolean, default: false },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
