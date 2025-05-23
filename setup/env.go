package setup

import "flag"

type Environment struct {
	Production bool
	Toggle bool
}

func Env() *Environment {
	env := &Environment{}
	flag.BoolVar(&env.Production, "production", false, "Run in production mode")
	flag.BoolVar(&env.Toggle, "toggle", false, "Show/hide the window and exit")

	flag.Parse()
	return env
}
