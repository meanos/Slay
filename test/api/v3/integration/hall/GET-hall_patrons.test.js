import {times} from 'lodash';
import {generateUser, resetSlayDB, translate as t,} from '../../../../helpers/api-integration/v3';

describe('GET /hall/patrons', () => {
  let user;

  beforeEach(async () => {
    await resetSlayDB();
    user = await generateUser();
  });

  it('fails if req.query.page is not numeric', async () => {
    await expect(user.get('/hall/patrons?page=notNumber')).to.eventually.be.rejected.and.eql({
      code: 400,
      error: 'BadRequest',
      message: t('invalidReqParams'),
    });
  });

  it('returns all patrons sorted by -backer.tier and with correct fields', async () => {
    const patron1 = await generateUser({
      backer: { tier: 1 },
    });
    const patron2 = await generateUser({
      backer: { tier: 3 },
    });

    const patrons = await user.get('/hall/patrons');
    expect(patrons.length).to.equal(2);
    expect(patrons[0]._id).to.equal(patron2._id);
    expect(patrons[1]._id).to.equal(patron1._id);

    expect(patrons[0]).to.have.all.keys(['_id', 'contributor', 'backer', 'profile']);
    expect(patrons[1]).to.have.all.keys(['_id', 'contributor', 'backer', 'profile']);

    expect(patrons[0].profile).to.have.all.keys(['name']);
    expect(patrons[1].profile).to.have.all.keys(['name']);

    expect(patrons[0].profile.name).to.equal(patron2.profile.name);
    expect(patrons[1].profile.name).to.equal(patron1.profile.name);
  });

  it('returns only first 50 patrons per request, more if req.query.page is passed', async () => {
    await Promise.all(times(53, n => generateUser({ backer: { tier: n } })));

    const patrons = await user.get('/hall/patrons');
    expect(patrons.length).to.equal(50);

    const morePatrons = await user.get('/hall/patrons?page=1');
    expect(morePatrons.length).to.equal(2);
    expect(morePatrons[0].backer.tier).to.equal(2);
    expect(morePatrons[1].backer.tier).to.equal(1);
  }).timeout(10000);
});
