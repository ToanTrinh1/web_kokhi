package health

// Advice returns Vietnamese health guidance and risk level for an AQI value.
func Advice(aqi int) (riskLevel, advice string) {
	switch {
	case aqi <= 50:
		return "good", "Chất lượng không khí tốt. Mọi người có thể hoạt động ngoài trời bình thường."
	case aqi <= 100:
		return "moderate", "Chất lượng không khí trung bình. Trẻ em, người già và nhóm nhạy cảm nên hạn chế vận động mạnh ngoài trời."
	case aqi <= 150:
		return "unhealthy_sensitive", "Nhóm nhạy cảm nên hạn chế ra ngoài. Người khỏe mạnh có thể cảm thấy khó chịu khi vận động lâu."
	case aqi <= 200:
		return "unhealthy", "Mọi người nên hạn chế hoạt động ngoài trời. Nên đeo khẩu trang N95 khi ra đường."
	default:
		return "hazardous", "Rất nguy hiểm. Hạn chế ra ngoài, đóng cửa sổ và sử dụng máy lọc không khí nếu có."
	}
}
