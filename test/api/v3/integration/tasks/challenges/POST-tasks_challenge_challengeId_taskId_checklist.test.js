import {v4 as generateUUID} from 'uuid';
import {
  generateChallenge,
  generateGroup,
  generateUser,
  translate as t,
} from '../../../../../helpers/api-integration/v3';

describe('POST /tasks/:taskId/checklist/', () => {
  let user;
  let guild;
  let challenge;

  before(async () => {
    user = await generateUser();
    guild = await generateGroup(user);
    challenge = await generateChallenge(user, guild);
    await user.post(`/challenges/${challenge._id}/join`);
  });

  it('fails on task not found', async () => {
    await expect(user.post(`/tasks/${generateUUID()}/checklist`, {
      text: 'Checklist Item 1',
    })).to.eventually.be.rejected.and.eql({
      code: 404,
      error: 'NotFound',
      message: t('messageTaskNotFound'),
    });
  });

  it('returns error when user is not a member of the challenge', async () => {
    const task = await user.post(`/tasks/challenge/${challenge._id}`, {
      type: 'daily',
      text: 'Daily with checklist',
    });

    const anotherUser = await generateUser();

    await expect(anotherUser.post(`/tasks/${task._id}/checklist`, {
      text: 'Checklist Item 1',
      ignored: false,
      _id: 123,
    }))
      .to.eventually.be.rejected.and.eql({
        code: 401,
        error: 'NotAuthorized',
        message: t('onlyChalLeaderEditTasks'),
      });
  });

  it('adds a checklist item to a daily', async () => {
    const task = await user.post(`/tasks/challenge/${challenge._id}`, {
      type: 'daily',
      text: 'Daily with checklist',
    });

    const savedTask = await user.post(`/tasks/${task._id}/checklist`, {
      text: 'Checklist Item 1',
      ignored: false,
      _id: 123,
    });

    expect(savedTask.checklist.length).to.equal(1);
    expect(savedTask.checklist[0].text).to.equal('Checklist Item 1');
    expect(savedTask.checklist[0].completed).to.equal(false);
    expect(savedTask.checklist[0].id).to.be.a('string');
    expect(savedTask.checklist[0].id).to.not.equal('123');
    expect(savedTask.checklist[0].ignored).to.be.an('undefined');
  });

  it('adds a checklist item to a todo', async () => {
    const task = await user.post(`/tasks/challenge/${challenge._id}`, {
      type: 'todo',
      text: 'Todo with checklist',
    });

    const savedTask = await user.post(`/tasks/${task._id}/checklist`, {
      text: 'Checklist Item 1',
      ignored: false,
      _id: 123,
    });

    expect(savedTask.checklist.length).to.equal(1);
    expect(savedTask.checklist[0].text).to.equal('Checklist Item 1');
    expect(savedTask.checklist[0].completed).to.equal(false);
    expect(savedTask.checklist[0].id).to.be.a('string');
    expect(savedTask.checklist[0].id).to.not.equal('123');
    expect(savedTask.checklist[0].ignored).to.be.an('undefined');
  });

  it('does not add a checklist to habits', async () => {
    const habit = await user.post(`/tasks/challenge/${challenge._id}`, {
      type: 'habit',
      text: 'habit with checklist',
    });

    await expect(user.post(`/tasks/${habit._id}/checklist`, {
      text: 'Checklist Item 1',
    })).to.eventually.be.rejected.and.eql({
      code: 400,
      error: 'BadRequest',
      message: t('checklistOnlyDailyTodo'),
    });
  });

  it('does not add a checklist to rewards', async () => {
    const reward = await user.post(`/tasks/challenge/${challenge._id}`, {
      type: 'reward',
      text: 'reward with checklist',
    });

    await expect(user.post(`/tasks/${reward._id}/checklist`, {
      text: 'Checklist Item 1',
    })).to.eventually.be.rejected.and.eql({
      code: 400,
      error: 'BadRequest',
      message: t('checklistOnlyDailyTodo'),
    });
  });
});
