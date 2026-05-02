package store

type StoreService struct {
	client    *APIClient
	registry  *RegistryManager
	installer *Installer
}

func NewStoreService() *StoreService {
	return &StoreService{
		client:    NewAPIClient(),
		registry:  NewRegistryManager(),
		installer: NewInstaller(),
	}
}

func (s *StoreService) GetExtensions() ([]Extension, error) {
	if err := s.registry.Load(); err != nil {
		return nil, err
	}

	extensions, err := s.client.FetchExtensions()
	if err != nil {
		return nil, err
	}

	for i := range extensions {
		extensions[i].Installed = s.registry.Exists(extensions[i].Name)
	}

	return extensions, nil
}

func (s *StoreService) SearchExtensions(query string) ([]Extension, error) {
	if err := s.registry.Load(); err != nil {
		return nil, err
	}

	extensions, err := s.client.SearchExtensions(query)
	if err != nil {
		return nil, err
	}

	for i := range extensions {
		extensions[i].Installed = s.registry.Exists(extensions[i].Name)
	}

	return extensions, nil
}

func (s *StoreService) InstallExtension(id string) error {
	extensions, err := s.client.FetchExtensions()
	if err != nil {
		return err
	}

	var target *Extension
	for i := range extensions {
		if extensions[i].ID == id {
			target = &extensions[i]
			break
		}
	}

	if target == nil {
		return ErrExtensionNotFound
	}

	if err := s.installer.Install(target.DownloadURL, target.Name); err != nil {
		return err
	}

	extPath := s.registry.GetExtensionPath(target.Name)
	installed := NewInstalledExt(*target, extPath)

	if len(installed.Commands) > 0 {
		schemas, defaults := ExtractPreferences(extPath, installed.Commands[0].Name)
		if schemas != nil {
			installed.PreferenceSchema = schemas
		}
		if defaults != nil {
			installed.PreferenceValues = defaults
		}
	}

	if err := s.registry.Load(); err != nil {
		return err
	}

	if err := s.registry.Add(target.Name, installed); err != nil {
		return err
	}

	return s.registry.Save()
}

func (s *StoreService) UninstallExtension(name string) error {
	if err := s.installer.Uninstall(name); err != nil {
		return err
	}

	if err := s.registry.Load(); err != nil {
		return err
	}

	if err := s.registry.Remove(name); err != nil {
		return err
	}

	return s.registry.Save()
}

func (s *StoreService) GetInstalledExtensions() ([]InstalledExt, error) {
	if err := s.registry.Load(); err != nil {
		return nil, err
	}

	return s.registry.List(), nil
}

func (s *StoreService) GetExtensionCommands(name string) ([]Command, error) {
	if err := s.registry.Load(); err != nil {
		return nil, err
	}

	ext, ok := s.registry.Get(name)
	if !ok {
		return nil, ErrExtensionNotFound
	}

	return ext.Commands, nil
}

var ErrExtensionNotFound = errorf("extension not found")

func errorf(msg string) error {
	return &errorString{msg: msg}
}

type errorString struct {
	msg string
}

func (e *errorString) Error() string {
	return e.msg
}
