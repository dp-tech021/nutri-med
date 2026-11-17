"""Restrict the disposable Supabase CLI gateway; never reads a remote config.

Requires Docker and PyYAML. Run after each local stack recreation.
Only the functions-v1 CORS plugin is changed; credentials are never printed.
Managed hosting must enforce the same policy independently.
"""
import subprocess
import yaml

CONTAINER = 'supabase_kong_nutri-med'
CONFIG = '/home/kong/kong.yml'
raw = subprocess.check_output(['docker', 'exec', CONTAINER, 'cat', CONFIG], text=True)
config = yaml.safe_load(raw)
services = [service for service in config['services'] if service.get('name') == 'functions-v1']
if len(services) != 1:
    raise RuntimeError('EXPECTED_ONE_LOCAL_FUNCTIONS_SERVICE')
plugins = [plugin for plugin in services[0]['plugins'] if plugin['name'] == 'cors']
if len(plugins) != 1:
    raise RuntimeError('EXPECTED_ONE_FUNCTIONS_CORS_PLUGIN')
plugins[0]['config'] = {
    'origins': ['http://localhost:5173', 'http://127.0.0.1:5173'],
    'methods': ['GET', 'POST', 'PATCH', 'OPTIONS'],
    'headers': ['authorization', 'apikey', 'content-type'],
    'credentials': False,
    'preflight_continue': True,
}
def write_config(content):
    subprocess.run(
        ['docker', 'exec', '-u', '0', '-i', CONTAINER, 'sh', '-c', 'cat > /home/kong/kong.yml'],
        input=content, text=True, check=True, capture_output=True,
    )


write_config(yaml.safe_dump(config, sort_keys=False))
try:
    subprocess.run(['docker', 'exec', CONTAINER, 'kong', 'reload'], check=True, capture_output=True)
except subprocess.CalledProcessError:
    write_config(raw)
    subprocess.run(['docker', 'exec', CONTAINER, 'kong', 'reload'], check=True, capture_output=True)
    raise RuntimeError('LOCAL_CORS_RELOAD_FAILED_CONFIG_RESTORED') from None
print('PASS: local functions gateway CORS allowlist applied; API handles preflight; no wildcard')
