package app

import "fmt"

func (s *ClutchServices) ConfirmShell(allow bool) {
	s.Mu.Lock()
	defer s.Mu.Unlock()
	fmt.Println("Wails Mu:", &s.Mu)
	fmt.Println("Wails Ch:", &s.ConfirmCh)
	if s.ConfirmCh != nil {
		s.ConfirmCh <- allow
	}
}
