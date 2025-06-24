package app

func (s *ClutchServices) ToggleApp() {
	if s.IsVisible {
		s.App.Hide()
		s.IsVisible = false
	} else {
		s.App.Show()
		s.IsVisible = true
	}
}
