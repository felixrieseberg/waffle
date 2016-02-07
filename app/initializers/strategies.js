export function initialize(application) {
    // TODO: Magic logic to find all stragies
    const strategies = ['office'];

    strategies.forEach((strategyName) => {
        application.inject('component', `strategy:${strategyName}`, `service:strategy-${strategyName}`);
        application.inject('service:synchro', `strategy:${strategyName}`, `service:strategy-${strategyName}`);
    });
}

export default {
    name: 'strategies',
    initialize
};
