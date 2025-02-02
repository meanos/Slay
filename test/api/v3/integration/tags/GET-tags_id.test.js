import {generateUser,} from '../../../../helpers/api-integration/v3';

describe('GET /tags/:tagId', () => {
  let user;

  before(async () => {
    user = await generateUser();
  });

  it('returns a tag given it\'s id', async () => {
    const createdTag = await user.post('/tags', { name: 'Tag 1' });
    const tag = await user.get(`/tags/${createdTag.id}`);

    expect(tag).to.deep.equal(createdTag);
  });

  it('handles non-existing tags');
});
