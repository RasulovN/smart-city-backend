const { prisma } = require('../db/postgres');

// Test model CRUD operations

// Get all test records
const getAllTests = async (req, res) => {
  try {
    const tests = await prisma.testModel.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single test by ID
const getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await prisma.testModel.findUnique({
      where: { id: parseInt(id) }
    });
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new test
const createTest = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const test = await prisma.testModel.create({
      data: { name, description, isActive }
    });
    res.status(201).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update test
const updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const test = await prisma.testModel.update({
      where: { id: parseInt(id) },
      data: { name, description, isActive }
    });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete test
const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.testModel.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest
};
