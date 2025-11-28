const getTrafficData = (req, res) => {
  const trafficLights = [
    { id: 1, location: "Main Street", status: "green", congestion: "low" },
    { id: 2, location: "Broadway", status: "red", congestion: "high" },
    { id: 3, location: "Elm Avenue", status: "yellow", congestion: "medium" },
  ];

  res.json({
    status: "success",
    data: trafficLights,
    timestamp: Date.now(),
  });
};

const getTrafficById = (req, res) => {
  const { id } = req.params;
  // Mock data for demonstration
  const trafficLight = { id: parseInt(id), location: "Main Street", status: "green", congestion: "low" };
  res.json({
    status: "success",
    data: trafficLight,
  });
};

module.exports = {
  getTrafficData,
  getTrafficById,
};
