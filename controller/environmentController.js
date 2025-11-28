const getEnvironmentData = (req, res) => {
  const sensors = [
    { id: 1, location: "Park", airQuality: "good", temperature: 22, humidity: 60 },
    { id: 2, location: "Downtown", airQuality: "moderate", temperature: 25, humidity: 55 },
    { id: 3, location: "Suburb", airQuality: "poor", temperature: 20, humidity: 70 },
  ];

  res.json({
    status: "success",
    data: sensors,
    timestamp: Date.now(),
  });
};

const getSensorById = (req, res) => {
  const { id } = req.params;
  // Mock data for demonstration
  const sensor = { id: parseInt(id), location: "Park", airQuality: "good", temperature: 22, humidity: 60 };
  res.json({
    status: "success",
    data: sensor,
  });
};

module.exports = {
  getEnvironmentData,
  getSensorById,
};
