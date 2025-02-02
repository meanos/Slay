import range from 'lodash/range';
import {generateUser,} from '../../../../helpers/api-integration/v3';
import common from '../../../../../website/common';

describe('GET /user', () => {
  let user;

  before(async () => {
    user = await generateUser();
  });

  it('returns the authenticated user with computed stats', async () => {
    const returnedUser = await user.get('/user');
    expect(returnedUser._id).to.equal(user._id);

    expect(returnedUser.stats.maxMP).to.exist;
    expect(returnedUser.stats.maxHealth).to.equal(common.maxHealth);
    expect(returnedUser.stats.toNextLevel).to.equal(common.tnl(returnedUser.stats.lvl));
  });

  it('does not return private paths (and apiToken)', async () => {
    const returnedUser = await user.get('/user');

    expect(returnedUser.auth.local.hashed_password).to.not.exist;
    expect(returnedUser.auth.local.passwordHashMethod).to.not.exist;
    expect(returnedUser.auth.local.salt).to.not.exist;
    expect(returnedUser.apiToken).to.not.exist;
    expect(returnedUser.secret).to.not.exist;
  });

  it('returns only user properties requested', async () => {
    const returnedUser = await user.get('/user?userFields=achievements,items.mounts');

    expect(returnedUser._id).to.equal(user._id);
    expect(returnedUser.achievements).to.exist;
    expect(returnedUser.items.mounts).to.exist;
    // Notifications are always returned
    expect(returnedUser.notifications).to.exist;
    expect(returnedUser.stats).to.not.exist;
  });

  it('does not return requested private properties', async () => {
    const returnedUser = await user.get('/user?userFields=apiToken,secret.text');

    expect(returnedUser.apiToken).to.not.exist;
    expect(returnedUser.secret).to.not.exist;
  });

  it('returns the full inbox', async () => {
    const otherUser = await generateUser();
    const amountOfMessages = 12;

    const allMessagesPromise = range(amountOfMessages)
      .map(i => otherUser.post('/members/send-private-message', {
        toUserId: user.id,
        message: `Message Num: ${i}`,
      }));

    await Promise.all(allMessagesPromise);

    const returnedUser = await user.get('/user');

    expect(returnedUser._id).to.equal(user._id);
    expect(returnedUser.inbox).to.exist;
    expect(Object.keys(returnedUser.inbox.messages)).to.have.a.lengthOf(amountOfMessages);
  });
});
