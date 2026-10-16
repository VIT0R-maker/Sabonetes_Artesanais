import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
process.stdin.setRawMode?.(true);
process.stdin.resume();
process.stdout.write('Ready for source credential JSON on stdin (input hidden).\n');
let input = '';
process.stdin.on('data', chunk => {
  input += chunk.toString();
  if (!/[\r\n]/.test(input)) return;
  process.stdin.pause();
  process.stdin.setRawMode?.(false);
  let credential;
  try {
    credential = JSON.parse(input.trim());
    const url = new URL(credential.remote_url);
    if (url.protocol !== 'https:' || url.username || url.password || credential.auth_mode !== 'http_extra_header') throw new Error('Invalid scoped credential');
    const env = { ...process.env, SITES_AUTH: `Authorization: Bearer ${credential.token}`, GIT_TERMINAL_PROMPT: '0' };
    const auth = ['-c','credential.helper=','-c','http.extraHeader=','-c','http.followRedirects=false',`--config-env=http.${credential.remote_url}.extraHeader=SITES_AUTH`];
    const git = args => {
      const result = spawnSync('git', args, { cwd: resolve('site'), env, encoding: 'utf8' });
      if (result.status !== 0) throw new Error((result.stderr || result.error?.message || 'Git operation failed').split(credential.token).join('[redacted]'));
      return result.stdout.trim();
    };
    const sha = git(['rev-parse','HEAD']);
    if (git(['status','--porcelain'])) throw new Error('Source has uncommitted changes');
    git([...auth, 'push', credential.remote_url, `HEAD:refs/heads/${credential.branch}`]);
    const remoteSha = git([...auth,'ls-remote',credential.remote_url,`refs/heads/${credential.branch}`]).split(/\s+/)[0];
    if (remoteSha !== sha) throw new Error('Remote verification failed');
    git(['archive','--format=tar','--output=../site-deployment.tar','HEAD','.openai/hosting.json','dist']);
    console.log(JSON.stringify({commit_sha:sha,archive:resolve('site-deployment.tar')}));
    process.exit(0);
  } catch (error) {
    console.error(String(error.message).split(credential?.token || 'NO_TOKEN').join('[redacted]'));
    process.exit(1);
  }
});
