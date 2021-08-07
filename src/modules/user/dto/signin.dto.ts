export class SignindDto {
  readonly accountType: 'phone' | 'email' = 'phone';

  readonly signinType: 'password' | 'authCode' = 'password';

  /**
   * 登录账号, 可能是 email / phone / id
   */
  readonly account: string = '';

  /**
   * password or authCode
   */
  readonly code: string = '';
}
