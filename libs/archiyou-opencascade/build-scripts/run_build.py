import os
import pathlib

#### SETTINGS ####

YAML_FILE = 'archiyou-opencascade.yml'
#OCJS_DOCKER_TAG = '2.0.0-beta.dd8ce1a'
#OCJS_DOCKER_TAG = '2.0.0-beta.94e2944'
#TEST:
OCJS_DOCKER_TAG='2.0.0-beta.b5ff984'

cur_path = pathlib.Path().resolve()

cmd = f'docker run -it --rm -v {cur_path}:/src donalffons/opencascade.js:{OCJS_DOCKER_TAG} {YAML_FILE}'
print(cmd)
os.system(cmd)