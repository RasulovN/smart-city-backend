const getTransportData = (req, res) => {
  const buses = [
    { id: 17, lat: 38.88951, lng: 65.73412, route: "A-17" },
    { id: 44, lat: 38.88122, lng: 65.74244, route: "T-44" },
    { id: 12, lat: 38.88491, lng: 65.73901, route: "B-12" },
  ];

  res.json({
    status: "success",
    data: buses,
    timestamp: Date.now(),
  });
};

const getBusById = (req, res) => {
  const { id } = req.params;
  // Mock data for demonstration
  const bus = { id: parseInt(id), lat: 38.88951, lng: 65.73412, route: "A-17" };
  res.json({
    status: "success",
    data: bus,
  });
};

module.exports = {
  getTransportData,
  getBusById,
};
